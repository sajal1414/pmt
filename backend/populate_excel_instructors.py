import openpyxl
from copy import copy

FILE_PATH = r"C:\Users\PrajwalLute\Downloads\nFolks Learning Services Course Inventory 2.10.26 1.xlsx"

wb = openpyxl.load_workbook(FILE_PATH)
ws = wb.active
print(f"Sheet title: {ws.title}, max_row={ws.max_row}, max_column={ws.max_column}")

# Header for column 37
inst_header_cell = ws.cell(row=1, column=37)
inst_header_cell.value = "Instructor"
# Copy style from column 36 header if available
prev_header = ws.cell(row=1, column=36)
if prev_header.has_style:
    inst_header_cell.font = copy(prev_header.font)
    inst_header_cell.border = copy(prev_header.border)
    inst_header_cell.fill = copy(prev_header.fill)
    inst_header_cell.alignment = copy(prev_header.alignment)

counts = {
    "Dr. Sarah Jenkins": 0,
    "Marcus Vance": 0,
    "Elena Rostova": 0,
    "Vikram Anand": 0,
    "Dr. Sarah Jenkins, Vikram Anand": 0,
    "Elena Rostova, Marcus Vance": 0,
    "Elena Rostova, Vikram Anand": 0
}

for r in range(2, ws.max_row + 1):
    plat = str(ws.cell(r, 2).value or "").strip().lower()
    prod = str(ws.cell(r, 4).value or "").strip().lower()
    name = str(ws.cell(r, 8).value or "").strip().lower()

    # Determine assigned instructor based on domain / skills
    if "security" in plat or "verify" in prod or "qradar" in prod or "guardium" in prod:
        assigned = "Marcus Vance"
    elif "cloud" in plat or "infrastructure" in plat or "openshift" in prod or "rhos" in prod or "storage" in prod or "kubernetes" in name:
        assigned = "Elena Rostova"
    elif "integration" in prod or "iwhi" in prod or "websphere" in prod or "mq" in prod or "app connect" in prod or "baw" in prod or "automation" in plat:
        assigned = "Vikram Anand"
    elif "data" in plat or "ai" in plat or "cognos" in prod or "watson" in prod or "bamoe" in prod or "db2" in prod:
        assigned = "Dr. Sarah Jenkins"
    elif "sustainability" in plat or "maximo" in prod or "tririga" in prod:
        # Sustainability enterprise asset management / IoT integration
        assigned = "Vikram Anand"
    else:
        assigned = "Dr. Sarah Jenkins"

    # For testing multi-instructor assignment on some courses:
    # Every 7th row, test multi-instructor
    if r % 15 == 0:
        assigned = "Dr. Sarah Jenkins, Vikram Anand"
    elif r % 15 == 5:
        assigned = "Elena Rostova, Marcus Vance"
    elif r % 15 == 10:
        assigned = "Elena Rostova, Vikram Anand"

    cell = ws.cell(row=r, column=37)
    cell.value = assigned
    counts[assigned] = counts.get(assigned, 0) + 1

    # Also style the cell similarly to column 36
    prev_cell = ws.cell(row=r, column=36)
    if prev_cell.has_style:
        cell.font = copy(prev_cell.font)
        cell.alignment = copy(prev_cell.alignment)

wb.save(FILE_PATH)
print("Saved successfully!")
print("Instructor assignment distribution:")
for k, v in counts.items():
    print(f"  {k}: {v}")
