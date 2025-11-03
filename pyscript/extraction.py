# pyscript/extraction.py
# Lightweight PyScript extractor (browser-friendly)
from js import document, console, localStorage, URL, Blob
from pyodide.ffi import create_proxy
import asyncio, re, json

def log(msg: str):
    status = document.getElementById("status")
    if status is None:
        console.warn("status element not found")
        return
    # append safely (use innerText/new line)
    status.innerText += f"> {msg}\n"
    status.scrollTop = status.scrollHeight

async def read_file_text(file):
    """
    Reads a file as text using FileReader asynchronously.
    For PDF real parsing please use extraction_real.py with pdfminer.
    """
    fut = asyncio.Future()
    def onload(evt):
        fut.set_result(evt.target.result)
    fr = __new__(FileReader())
    fr.onload = create_proxy(onload)
    fr.readAsText(file)
    return await fut

def extract_students_from_text(text: str):
    # A simple regex: reg no (5+ digits), name (words), course code (alphanumeric with letters)
    pattern = r"(\d{4,})\s+([A-Za-z][A-Za-z\s\.\-']{1,80}?)\s+([A-Z]{2,}[0-9A-Z\-]*)"
    matches = re.findall(pattern, text)
    students = []
    for m in matches:
        reg = m[0].strip()
        name = m[1].strip()
        code = m[2].strip()
        students.append({"reg_no": reg, "name": name, "course_code": code})
    return students

async def start_extraction(event=None):
    log("Starting batch extraction...")
    pdf_input = document.getElementById("pdf-file")
    spinner = document.getElementById("spinner")
    runbtn = document.getElementById("run-button")
    if not pdf_input or pdf_input.files.length == 0:
        log("No PDF files selected.")
        return
    spinner.classList.remove("hidden")
    runbtn.disabled = True
    combined = []
    total = pdf_input.files.length
    log(f"Found {total} file(s).")
    for i in range(total):
        f = pdf_input.files.item(i)
        log(f"Processing {i+1}/{total}: {f.name}")
        try:
            text = await read_file_text(f)
            extracted = extract_students_from_text(text)
            combined.extend(extracted)
            log(f"Found {len(extracted)} students in {f.name}")
        except Exception as e:
            log(f"Error processing {f.name}: {e}")
        await asyncio.sleep(0.05)
    # Save to localStorage
    try:
        localStorage.setItem("uocExam_extractedData", json.dumps(combined))
        log(f"Saved {len(combined)} records to localStorage (uocExam_extractedData).")
    except Exception as e:
        log(f"Failed to save extracted data: {e}")
    # create downloadable CSV
    create_csv_download(combined)
    spinner.classList.add("hidden")
    runbtn.disabled = False
    # expose start_extraction to JS fallback
    window = __import__("js").window
    window.start_extraction = start_extraction

def create_csv_download(data):
    if not data:
        log("No data to generate CSV.")
        return
    keys = ["reg_no", "name", "course_code"]
    rows = [",".join(keys)]
    for row in data:
        rows.append(",".join([escape_csv(str(row.get(k,""))) for k in keys]))
    csv_text = "\n".join(rows)
    blob = Blob.new([csv_text], { "type": "text/csv" })
    url = URL.createObjectURL(blob)
    # append link into status
    status = document.getElementById("status")
    a = document.createElement("a")
    a.href = url
    a.download = "Combined_Nominal_Roll.csv"
    a.textContent = "📥 Download Combined_Nominal_Roll.csv"
    a.style.display = "block"
    a.style.marginTop = "6px"
    status.appendChild(a)

def escape_csv(val):
    if '"' in val or ',' in val or '\n' in val:
        val = val.replace('"', '""')
        return f'"{val}"'
    return val

# expose to window so JS fallback can call it if needed
try:
    window = __import__("js").window
    window.start_extraction = start_extraction
except Exception:
    pass
