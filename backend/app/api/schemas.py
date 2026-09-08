"""Pydantic schemas for the turn evaluation endpoint.

Mirrors the domain contract without coupling to internal types.
Patient IDs arrive as numbers (JSON); auxiliary IDs as strings.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Literal


class PatientIn(BaseModel):
    id: int | float = Field(..., gt=0)
    name: str = ""
    weight: float = Field(..., gt=0, le=1e300)
    barthel: int = Field(..., ge=0, le=100)
    braden: int = Field(..., ge=6, le=23)
    broncoFlags: list[bool] = Field(..., min_length=5, max_length=5)

    @field_validator("id")
    @classmethod
    def id_must_be_integral(cls, v: int | float) -> int | float:
        if isinstance(v, float) and not v.is_integer():
            raise ValueError("Patient ID must be an integer")
        return v


class AuxiliaryIn(BaseModel):
    id: str = Field(..., min_length=1)
    name: str = ""
    weight: float = Field(..., gt=0, le=1e300)

    @field_validator("id")
    @classmethod
    def id_not_proto(cls, v: str) -> str:
        if v.strip() == "" or v == "__proto__":
            raise ValueError("Invalid auxiliary ID")
        return v


class TurnRequest(BaseModel):
    # Reject an obsolete envelope such as {"state": {...}} instead of
    # silently evaluating the schema defaults as an empty clinical turn.
    model_config = ConfigDict(extra="forbid")
    patients: list[PatientIn] = Field(default_factory=list)
    auxiliaries: list[AuxiliaryIn] = Field(default_factory=list)
    assignments: dict[str, str] | None = None
    action: Literal["balance", "metrics", "preview"] = "balance"


class PatientPreviewIn(BaseModel):
    """Relaxed patient for preview: all clinical fields optional."""
    id: int | float | None = None
    name: str = ""
    weight: float | None = Field(default=None, gt=0, le=1e300)
    barthel: int | None = Field(default=None, ge=0, le=100)
    braden: int | None = Field(default=None, ge=6, le=23)
    broncoFlags: list[bool] | None = None


class AuxiliaryPreviewIn(BaseModel):
    """Relaxed auxiliary for preview."""
    id: str | None = None
    name: str = ""
    weight: float | None = Field(default=None, gt=0, le=1e300)


class PreviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    patients: list[PatientPreviewIn] = Field(default_factory=list)
    auxiliaries: list[AuxiliaryPreviewIn] = Field(default_factory=list)
