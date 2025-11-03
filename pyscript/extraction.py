from js import document, console, localStorage, Blob, URL
from pyodide.ffi import create_proxy
import pdfplumber, io, json, pandas as pd, re, asyncio

# ---------- helpers ----------
def log(msg):
    el = document.getElementById("status")
    el.innerText += f"> {msg}\n"
    el.scrollTop = el.scrollHeight
    console.log(msg)

async def read_file_bytes(file):
    fut = asyncio.Future()
    def onload(e): fut.set_result(e.target.result)
    reader = __new__(FileReader())
    reader.onload = create_proxy(onload)
    reader.readAsArrayBuffer(file)
    return await fut

# ---------- extraction ----------
def extract_students(text):
    """
    Detects pattern type and returns list of dicts.
    Handles both old and new PDF formats.
    """
    students = []
    old_pat = re.compile(r"(\d{6,})\s+([A-Za-z][A-Za-z\s\.\-']{1,80}?)\s+([A-Z]{2,}\d{1,}[A-Z0-9\-]*)")
    new_pat = re.compile(r"Reg\.? ?No[:\- ]+(\d{6,})[ \t]+Name[:\- ]+([A-Za-z][A-Za-z\s\.\-']{1,80}?)[ \t]+Paper.*?:? ?([A-Z]{2,}\d{1,}[A-Z0-9\-]*)", re.IGNORECASE)

    # pick dominant pattern
    old_hits = len(old_pat.findall(text))
    new_hits = len(new_pat.findall(text))
    pat = new_pat if new_hits > old_hits else old_pat
    log(f"Detected {'new' if pat==new_pat else 'old'} format ({max(old_hits,new_hits)} matches)")

    for m in pat.findall(text):
        reg, name, code = [s.strip() for s in m]
        students.append({
            "Register Number": reg,
            "Name": name,
            "Course": code,
            "Date": "",
            "Time": ""
        })
    return students

# ---------- main ----------
async def start_extraction(event=None):
    pdf_input = document.getElementById("pdf-file")
    spinner = document.getElementById("spinner")
    spinner.classList.remove("hidden")
    log("Starting extraction...")

    combined = []
    try:
        for i in range(pdf_input.files.length):
            f = pdf_input.files.item(i)
            log(f"Reading {f.name} ({i+1}/{pdf_input.files.length})")
            buffer = await read_file_bytes(f)
            data = io.BytesIO(buffer.to_py())
            with pdfplumber.open(data) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages)
                if not text.strip():
                    log(f"No text found in {f.name}")
                    continue
                students = extract_students(text)
                combined.extend(students)
                log(f"Found {len(students)} students in {f.name}")

        if not combined:
            log("No student data found in any file.")
        else:
            localStorage.setItem("examBaseData", json.dumps(combined))
            log(f"Saved {len(combined)} records to localStorage (examBaseData).")

            # CSV download
            df = pd.DataFrame(combined)
            csv_text = df.to_csv(index=False)
            blob = Blob.new([csv_text], {"type": "text/csv"})
            url = URL.createObjectURL(blob)
            a = document.createElement("a")
            a.href = url
            a.download = "Combined_Nominal_Roll.csv"
            a.textContent = "📥 Download Combined_Nominal_Roll.csv"
            a.style.display = "block"
            document.getElementById("status").appendChild(a)
            log("CSV ready for download.")
    except Exception as e:
        log(f"Error: {e}")
        console.error(e)
    finally:
        spinner.classList.add("hidden")
        log("Extraction complete.")
