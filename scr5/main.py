import pandas as pd
import pdfplumber
import re
import io
import js
from js import document, console, URL, Blob, window, localStorage
import asyncio
import json
from datetime import datetime

# --- Helper: Normalize Time Format (Fixes 002:00 PM issue) ---
def clean_time_string(t_str):
    if not t_str: return ""
    t_str = str(t_str).strip().upper().replace('.', ':')
    
    # Regex to find standard time pattern 12:00 PM
    match = re.search(r'(\d{1,2}):(\d{2})\s*(AM|PM)', t_str)
    if match:
        h, m, p = match.groups()
        return f"{int(h):02d}:{m} {p}"
    return t_str

# --- Helper: Normalize Date Format (Relaxed) ---
def clean_date_string(d_str):
    if not d_str: return ""
    d_str = str(d_str).strip()
    # Replace common separators with dots for consistency, but don't break if fails
    d_str = d_str.replace('-', '.').replace('/', '.')
    return d_str

# --- MAIN EXTRACTION FUNCTION ---
async def process_file(file):
    try:
        array_buffer = await file.arrayBuffer()
        file_bytes = array_buffer.to_bytes()
        
        pdf_file = io.BytesIO(file_bytes)
        extracted_data = []

        with pdfplumber.open(pdf_file) as pdf:
            for page in pdf.pages:
                # Extract table with tolerance
                table = page.extract_table({
                    "vertical_strategy": "lines", 
                    "horizontal_strategy": "lines",
                    "intersection_tolerance": 3
                })

                if not table:
                    continue

                for row in table:
                    # CLEANUP: Remove None values and strip whitespace
                    clean_row = [str(cell).strip() if cell else "" for cell in row]
                    
                    # FILTER: Skip empty rows
                    if not any(clean_row): continue
                    
                    # FILTER: Skip Header Rows
                    # Check if row contains header keywords anywhere
                    row_str = " ".join(clean_row).lower()
                    if "register number" in row_str or "name of candidate" in row_str:
                        continue

                    # VALIDATION: Check if it has enough columns
                    if len(clean_row) < 6:
                        continue

                    # DATA MAPPING (Standard Layout)
                    # Col 1: Date, Col 2: Time, Col 3: Course, Col 4: RegNo, Col 5: Name
                    date_val = clean_date_string(clean_row[1])
                    time_val = clean_time_string(clean_row[2])
                    course_val = clean_row[3].replace("\n", " ") 
                    reg_no_val = clean_row[4]
                    name_val = clean_row[5]

                    # *** RELAXED VALIDATION ***
                    # Accept RegNo as long as it's not empty and longer than 2 chars
                    if len(reg_no_val) < 2: 
                        continue
                        
                    # Accept Name as long as it's not empty
                    if len(name_val) < 1:
                        continue

                    extracted_data.append({
                        "Date": date_val,
                        "Time": time_val,
                        "Course": course_val,
                        "Register Number": reg_no_val,
                        "Name": name_val
                    })

        return extracted_data

    except Exception as e:
        print(f"Error processing file: {e}")
        js.console.error(f"Python Error: {e}")
        return []

async def start_extraction(event):
    file_input = document.getElementById("pdf-file")
    file_list = file_input.files
    
    if file_list.length == 0:
        js.alert("Please select at least one PDF file.")
        return

    # UI Feedback
    run_button = document.getElementById("run-button")
    spinner = document.getElementById("spinner")
    button_text = document.getElementById("button-text")
    status_div = document.getElementById("status")
    
    run_button.disabled = True
    run_button.classList.add("opacity-50", "cursor-not-allowed")
    spinner.classList.remove("hidden")
    button_text.innerText = "Processing..."
    status_div.innerText = "Starting extraction..."

    all_exam_rows = []
    
    try:
        for i in range(file_list.length):
            file = file_list.item(i)
            status_div.innerText = f"Processing file {i+1}/{file_list.length}: {file.name}..."
            
            data = await process_file(file)
            all_exam_rows.extend(data)
            
        # SORTING
        status_div.innerText = "Sorting data..."
        
        def sort_key(row):
            try:
                d = datetime.strptime(row["Date"], "%d.%m.%Y")
            except:
                d = datetime.min
            try:
                t = datetime.strptime(row["Time"], "%I:%M %p")
            except:
                t = datetime.min
            return (d, t, row["Course"], row["Register Number"])

        try:
            all_exam_rows.sort(key=sort_key)
        except Exception as e:
            console.warn(f"Sorting partially failed (likely date format issue): {e}")
            # Fallback: Sort by Register Number string
            all_exam_rows.sort(key=lambda x: x["Register Number"])

        # --- HANDOFF TO JAVASCRIPT ---
        json_data = json.dumps(all_exam_rows)
        js.window.handlePythonExtraction(json_data)
        # -----------------------------

        status_div.innerText = f"Done! Extracted {len(all_exam_rows)} candidates."

    except Exception as e:
        js.alert(f"An error occurred: {str(e)}")
        status_div.innerText = "Error occurred."
        
    finally:
        # Reset UI
        run_button.disabled = False
        run_button.classList.remove("opacity-50", "cursor-not-allowed")
        spinner.classList.add("hidden")
        button_text.innerText = "Run Batch Extraction"

# Expose function to HTML
window.start_extraction = start_extraction
