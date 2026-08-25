#!/usr/bin/env python3
"""
Confidence Scorer - FIJAS IA
Calcula el puntaje y nivel de confianza cuantitativo.
"""
import sys
import json

def calculate_confidence(sample_size, data_quality_score, edge_ev, model_brier=0.15):
    if sample_size < 5:
        return 20, "INSUFFICIENT_DATA"
        
    c_sample = min(100.0, (sample_size / 15.0) * 100.0)
    c_data = float(data_quality_score)
    c_calib = max(0.0, min(100.0, (1.0 - model_brier * 2) * 100.0))
    c_edge = min(100.0, max(0.0, (edge_ev / 15.0) * 100.0))
    
    score = 0.30 * c_data + 0.25 * c_sample + 0.25 * c_calib + 0.20 * c_edge
    score = round(score, 1)
    
    if score >= 80:
        level = "HIGH"
    elif score >= 60:
        level = "MEDIUM"
    elif score >= 40:
        level = "LOW"
    else:
        level = "INSUFFICIENT_DATA"
        
    return score, level

if __name__ == "__main__":
    score, level = calculate_confidence(18, 95, 12.4)
    print(f"Confidence Score: {score}, Level: {level}")
