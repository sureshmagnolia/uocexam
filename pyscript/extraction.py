from js import document, console, localStorage, URL, Blob
from pyodide.ffi import create_proxy
import asyncio, re, json

def log(msg: str):
    status = document.getElementById("status")
    if status:
        status.innerText += f"> {msg}\n"
        status.scrollTop = status.scrollHeight
    console.log(msg)

async def read_file_text(file):
    fut = asyncio.Future()
    def onload(evt): fut.set_result(evt.target.result)
    fr = __new__(FileReader())
    fr.onload = create_proxy(onload)
    fr.readAsText(file)
    return await fut

def extract_students_from_text(text: str):
    pattern = r"(\d{4,})\s+([A-Za-z][A-Za-z\s\.\-']{1,80}?)\s+([A-Z]{2,}[0-9A-Z\-]*)"
    matches = re.findall(pattern, text)
    return [{"reg_no": m[0].strip(), "name": m[1].strip(), "course_code": m[2].strip()} for m in matches]

async def start_extraction(event=None):
    log("Starting extraction...")
    pdf_input = document.getElementById("pdf-file")
    spinner = document.getElementById("spinner")
    if not pdf_input or pdf_input.files.length == 0:
        log("No PDF files selected.")
        return

    spinner.classList.remove("hidden")
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

    try:
        localStorage.setItem("uocExam_extractedData", json.dumps(combined))
        log(f"Saved {len(combined)} records to localStorage (uocExam_extractedData).")
    except Exception as e:
        log(f"Failed to save extracted data: {e}")

    create_csv_download(combined)
    spinner.classList.add("hidden")
    log("Extraction complete.")

def create_csv_download(data):
    if not data:
        log("No data to export.")
        return
    keys = ["reg_no", "name", "course_code"]
    rows = [",".join(keys)]
    for row in data:
        vals = [escape_csv(str(row.get(k, ""))) for k in keys]
        rows.append(",".join(vals))
    csv_text = "\n".join(rows)
    blob = Blob.new([csv_text], { "type": "text/csv" })
    url = URL.createObjectURL(blob)
    a = document.createElement("a")
    a.href = url
    a.download = "Combined_Nominal_Roll.csv"
    a.textContent = "📥 Download Combined_Nominal_Roll.csv"
    a.style.display = "block"
    a.style.marginTop = "6px"
    document.getElementById("status").appendChild(a)
    log("CSV ready for download.")

def escape_csv(value: str):
    if any(ch in value for ch in [',', '"', '\n']):
        value = value.replace('"', '""')
        return f'"{value}"'
    return value
