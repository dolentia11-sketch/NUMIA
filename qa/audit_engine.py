"""Run the differential/security audit and generate reproducible QA artifacts.

From the project root: py -3 -B qa/audit_engine.py
Only synthetic inputs are used. Outputs are local audit evidence, never runtime logs.
"""

import contextlib
import hashlib
import importlib
import importlib.util
import io
import json
import platform
import statistics
import sys
import time
import unittest
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
EVIDENCE = ROOT / "plan paso a paso numia" / "evidence"
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND / "tests"))

from test_differential import SEED, randomized_turns  # noqa: E402
from app.domain.engine import evaluate_turn  # noqa: E402


def fingerprint(path):
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def benchmark(turn):
    original = EVIDENCE / "AUDIT-100_BEFORE" / "domain"
    spec = importlib.util.spec_from_file_location(
        "audit_original_domain", original / "__init__.py", submodule_search_locations=[str(original)]
    )
    package = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = package
    spec.loader.exec_module(package)
    before = importlib.import_module("audit_original_domain.engine").evaluate_turn
    timings = {"before_ms": [], "after_ms": []}
    for repeat in range(5):
        # Alternate order to reduce systematic warmup/ordering bias.
        variants = [("before_ms", before), ("after_ms", evaluate_turn)]
        for label, function in variants if repeat % 2 == 0 else reversed(variants):
            start = time.perf_counter()
            function(**turn)
            timings[label].append(round((time.perf_counter() - start) * 1000, 3))
    timings["before_median_ms"] = statistics.median(timings["before_ms"])
    timings["after_median_ms"] = statistics.median(timings["after_ms"])
    return {"patients": len(turn["patients"]), "auxiliaries": len(turn["auxiliaries"]),
            "repetitions_each": 5, "includes_input_validation_after": True,
            "note": "Local sequential domain calls; not HTTP concurrency or a production SLA.", **timings}


def main():
    suite = unittest.defaultTestLoader.discover(str(BACKEND / "tests"))
    log = io.StringIO()
    start = time.perf_counter()
    with contextlib.redirect_stdout(log):
        result = unittest.TextTestRunner(stream=log, verbosity=2).run(suite)
    elapsed = time.perf_counter() - start
    turns = randomized_turns()
    domain = BACKEND / "app" / "domain"
    original = EVIDENCE / "AUDIT-100_BEFORE" / "domain"
    report = {
        "schema_version": 1, "utc_time": datetime.now(timezone.utc).isoformat(),
        "python": platform.python_version(), "platform": platform.platform(),
        "seed": SEED, "randomized_turns": len(turns), "independent_metrics_snapshots": len(turns),
        "patients": sum(len(t["patients"]) for t in turns),
        "auxiliaries": sum(len(t["auxiliaries"]) for t in turns),
        "exact_comparison": True, "tests_run": result.testsRun, "failures": len(result.failures),
        "errors": len(result.errors), "skipped": len(result.skipped),
        "passed": result.wasSuccessful(), "elapsed_tests_seconds": round(elapsed, 3),
        "original_html_sha256": fingerprint(ROOT / "index.html"),
        "reference_html_sha256": fingerprint(ROOT / "reference" / "index.html"),
        "current_domain_sha256": {p.name: fingerprint(p) for p in sorted(domain.glob("*.py"))},
        "before_domain_sha256": {p.name: fingerprint(p) for p in sorted(original.glob("*.py"))},
        "test_sources_sha256": {p.name: fingerprint(p) for p in sorted((BACKEND / "tests").glob("test_*.py"))},
        "oracle_sha256": fingerprint(ROOT / "qa" / "html_oracle.cjs"),
        "performance": benchmark(turns[-1]) if result.wasSuccessful() else None,
        "production_release_approved": False,
    }
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    (EVIDENCE / "AUDIT-100_RESULT.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    (EVIDENCE / "AUDIT-100_TESTS.txt").write_text(log.getvalue(), encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    raise SystemExit(main())
