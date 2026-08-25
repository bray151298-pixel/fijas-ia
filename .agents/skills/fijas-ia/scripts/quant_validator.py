#!/usr/bin/env python3
"""
Quant Validator - FIJAS IA
Validador cuantitativo de calidad de datos y consistencia matemática.
"""
import sys
import json

def validate_analysis_payload(payload):
    errors = []
    
    required_fields = ["analysis_id", "timestamp", "data_quality", "model", "prediction", "confidence", "validation_status"]
    for f in required_fields:
        if f not in payload:
            errors.append(f"Missing required top-level field: {f}")
            
    dq = payload.get("data_quality", {})
    if dq.get("sample_size", 0) < 5:
        errors.append("Sample size too small (< 5). Must trigger INSUFFICIENT_DATA.")
        
    conf = payload.get("confidence", {})
    score = conf.get("score", 0)
    level = conf.get("level", "")
    
    if score >= 80 and level != "HIGH":
        errors.append("Score >= 80 must have level 'HIGH'")
    elif score < 40 and level != "INSUFFICIENT_DATA":
        errors.append("Score < 40 must have level 'INSUFFICIENT_DATA'")
        
    return len(errors) == 0, errors

if __name__ == "__main__":
    if len(sys.argv) > 1:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            data = json.load(f)
        valid, errs = validate_analysis_payload(data)
        if valid:
            print("Validation PASSED")
            sys.exit(0)
        else:
            print("Validation FAILED:", errs)
            sys.exit(1)
    else:
        print("Usage: quant_validator.py <payload.json>")
