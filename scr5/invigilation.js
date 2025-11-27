import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, orderBy } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = window.firebase.auth;
const db = window.firebase.db;
const provider = window.firebase.provider;

// --- CONFIG ---
const DEFAULT_DESIGNATIONS = { "Assistant Professor": 2, "Associate Professor": 1, "Guest Lecturer": 4, "Professor": 0 };
const DEFAULT_ROLES = { "Vice Principal": 0, "HOD": 1, "NSS Officer": 1, "Warden": 0, "Exam Chief": 0 };

// --- STATE ---
let currentUser = null;
let currentCollegeId = null;
let collegeData = null;
let staffData = [];
let invigilationSlots = {}; 
let designationsConfig = {};
let rolesConfig = {};
let currentCalDate = new Date(); // For Staff Calendar

// --- DOM ELEMENTS ---
const views = { login: document.getElementById('view-login'), admin: document.getElementById('view-admin'), staff: document.getElementById('view-staff') };
const ui = {
    headerName: document.getElementById('header-college-name'), authSection: document.getElementById('auth-section'),
    userName: document.getElementById('user-name'), userRole: document.getElementById('user-role'),
    staffTableBody: document.getElementById('staff-table-body'),
    adminSlotsGrid: document.getElementById('admin-slots-grid'),
    calGrid: document.getElementById('calendar-grid'),
    calTitle: document.getElementById('cal-month-title')
};

// --- AUTHENTICATION ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await handleLogin(user);
    } else {
        currentUser = null;
        showView('login');
        document.getElementById('auth-section').classList.add('hidden');
    }
});

document.getElementById('login-btn').addEventListener('click', () => signInWithPopup(auth, provider));
document.getElementById('logout-btn').addEventListener('click', () => signOut(auth).then(() => window.location.reload()));

// --- NEW FETCH LOGIC (CHUNKS) ---
async function fetchFullCollegeData(collegeId) {
    const mainRef = doc(db, "colleges", collegeId);
    const mainSnap = await getDoc(mainRef);
    if (!mainSnap.exists()) return null;
    let fullData = mainSnap.data();
    // For invigilation we don't strictly need chunked student data, the slots summary is enough.
    return fullData;
}

async function handleLogin(user) {
    document.getElementById('login-btn').innerText = "Verifying...";
    const collegesRef = collection(db, "colleges");
    const q = query(collegesRef, where("allowedUsers", "array-contains", user.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        currentCollegeId = docSnap.id;
        collegeData = await fetchFullCollegeData(currentCollegeId);
        initAdminDashboard();
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const urlId = urlParams.get('id');
        if (urlId) await checkStaffAccess(urlId, user.email);
        else { alert("Access Denied."); signOut(auth); }
    }
}

async function checkStaffAccess(collegeId, email) {
    const docRef = doc(db, "colleges", collegeId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        const staffList = JSON.parse(data.examStaffData || '[]');
        const me = staffList.find(s => s.email.toLowerCase() === email.toLowerCase());
        if (me) {
            currentCollegeId = collegeId;
            collegeData = data;
            initStaffDashboard(me);
        } else { alert("Email not found."); signOut(auth); }
    } else { alert("Invalid Link."); signOut(auth); }
}

// --- ADMIN DASHBOARD ---
function initAdminDashboard() {
    ui.headerName.textContent = collegeData.examCollegeName;
    ui.userName.textContent = currentUser.displayName;
    ui.userRole.textContent = "ADMIN";
    document.getElementById('auth-section').classList.remove('hidden');
    
    designationsConfig = JSON.parse(collegeData.invigDesignations || JSON.stringify(DEFAULT_DESIGNATIONS));
    rolesConfig = JSON.parse(collegeData.invigRoles || JSON.stringify(DEFAULT_ROLES));
    staffData = JSON.parse(collegeData.examStaffData || '[]');
    invigilationSlots = JSON.parse(collegeData.examInvigilationSlots || '{}');

    updateAdminUI();
    renderSlotsGridAdmin();
    showView('admin');
}

function updateAdminUI() {
    document.getElementById('stat-total-staff').textContent = staffData.length;
    const acYear = getCurrentAcademicYear();
    document.getElementById('lbl-academic-year').textContent = `AY: ${acYear.label}`;
    const desigSelect = document.getElementById('stf-designation');
    if(desigSelect) desigSelect.innerHTML = Object.keys(designationsConfig).map(r => `<option value="${r}">${r}</option>`).join('');
    renderStaffTable(); 
}

function renderStaffTable() {
    if(!ui.staffTableBody) return;
    ui.staffTableBody.innerHTML = '';
    const filter = document.getElementById('staff-search').value.toLowerCase();

    staffData.forEach((staff, index) => {
        if (filter && !staff.name.toLowerCase().includes(filter)) return;
        const target = calculateStaffTarget(staff);
        const done = staff.dutiesDone || 0; 
        const pending = target - done;
        let activeRoleLabel = "";
        const today = new Date();
        if (staff.roleHistory) {
            const activeRole = staff.roleHistory.find(r => new Date(r.start) <= today && new Date(r.end) >= today);
            if (activeRole) activeRoleLabel = `<span class="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded ml-1">${activeRole.role}</span>`;
        }
        const statusColor = pending > 3 ? 'text-red-600 font-bold' : (pending > 0 ? 'text-orange-600' : 'text-green-600');
        const row = document.createElement('tr');
        row.className = "hover:bg-gray-50 transition border-b border-gray-100";
        row.innerHTML = `
            <td class="px-6 py-3"><div class="flex items-center"><div class="h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs mr-3">${staff.name.charAt(0)}</div><div><div class="text-sm font-bold text-gray-800">${staff.name}</div><div class="text-xs text-gray-500">${staff.designation} ${activeRoleLabel}</div></div></div></td>
            <td class="px-6 py-3 text-center font-mono text-sm text-gray-600">${target}</td>
            <td class="px-6 py-3 text-center font-mono text-sm font-bold">${done}</td>
            <td class="px-6 py-3 text-center font-mono text-sm ${statusColor}">${pending}</td>
            <td class="px-6 py-3 text-right text-xs font-medium flex justify-end gap-2"><button onclick="openRoleAssignmentModal(${index})" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded">Role</button><button onclick="deleteStaff(${index})" class="text-red-500 hover:text-red-700">&times;</button></td>
        `;
        ui.staffTableBody.appendChild(row);
    });
}

// --- STAFF DASHBOARD & CALENDAR ---
function initStaffDashboard(me) {
    ui.headerName.textContent = collegeData.examCollegeName;
    ui.userName.textContent = me.name;
    ui.userRole.textContent = "INVIGILATOR";
    document.getElementById('auth-section').classList.remove('hidden');
    
    document.getElementById('staff-view-name').textContent = me.name;
    const pending = calculateStaffTarget(me) - (me.dutiesDone || 0);
    document.getElementById('staff-view-pending').textContent = pending > 0 ? pending : "0 (Done)";
    
    invigilationSlots = JSON.parse(collegeData.examInvigilationSlots || '{}');
    
    renderStaffCalendar(me.email);
    showView('staff');
    
    // Bind Calendar Nav Buttons
    document.getElementById('cal-prev').onclick = () => { currentCalDate.setMonth(currentCalDate.getMonth()-1); renderStaffCalendar(me.email); };
    document.getElementById('cal-next').onclick = () => { currentCalDate.setMonth(currentCalDate.getMonth()+1); renderStaffCalendar(me.email); };
}

// *** CORE CALENDAR LOGIC ***
function renderStaffCalendar(myEmail) {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    ui.calTitle.textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Group Slots by Date
    const slotsByDate = {};
    Object.keys(invigilationSlots).forEach(key => {
        const [dStr] = key.split(' | ');
        const [dd, mm, yyyy] = dStr.split('.');
        if (parseInt(mm) === month + 1 && parseInt(yyyy) === year) {
            const dayNum = parseInt(dd);
            if (!slotsByDate[dayNum]) slotsByDate[dayNum] = [];
            slotsByDate[dayNum].push({ key, ...invigilationSlots[key] });
        }
    });

    // Upcoming Duties List
    const upcomingList = document.getElementById('staff-upcoming-list');
    upcomingList.innerHTML = '';
    let upcomingCount = 0;

    Object.keys(invigilationSlots).sort().forEach(key => {
        const slot = invigilationSlots[key];
        if(slot.assigned.includes(myEmail)) {
            upcomingCount++;
            upcomingList.innerHTML += `
                <div class="bg-blue-50 p-3 rounded-md border-l-4 border-blue-500">
                    <div class="font-bold text-sm text-gray-800">${key}</div>
                    <div class="text-xs text-blue-600 font-semibold mt-1">You are assigned</div>
                </div>
            `;
        }
    });
    if(upcomingCount === 0) upcomingList.innerHTML = `<p class="text-gray-400 text-sm italic">No upcoming duties assigned.</p>`;

    // Generate Grid
    let html = "";
    for (let i = 0; i < firstDayIndex; i++) html += `<div class="bg-gray-50 border border-gray-100 h-24"></div>`;

    for (let day = 1; day <= daysInMonth; day++) {
        const slots = slotsByDate[day] || [];
        let dayContent = `<div class="text-right font-bold text-sm p-1 text-gray-400">${day}</div>`;
        let bgClass = "bg-white";
        let borderClass = "border-gray-200";

        if (slots.length > 0) {
            let hasOpen = false;
            let isAssigned = false;
            let isUnavailable = false;
            let openCount = 0;

            slots.forEach(s => {
                const filled = s.assigned.length;
                if (filled < s.required) { hasOpen = true; openCount += (s.required - filled); }
                if (s.assigned.includes(myEmail)) isAssigned = true;
                if (s.unavailable.includes(myEmail)) isUnavailable = true;
            });

            if (isAssigned) {
                bgClass = "bg-blue-50";
                dayContent += `<div class="mx-1 mt-1 text-xs bg-blue-600 text-white px-2 py-1 rounded text-center font-bold shadow-sm">Assigned</div>`;
            } else if (isUnavailable) {
                bgClass = "bg-red-50";
                dayContent += `<div class="mx-1 mt-1 text-xs bg-red-100 text-red-600 px-2 py-1 rounded text-center font-bold border border-red-200">Unavailable</div>`;
            } else if (hasOpen) {
                bgClass = "bg-green-50 hover:bg-green-100 cursor-pointer";
                dayContent += `<div class="mx-1 mt-1 text-xs text-green-700 px-1 text-center"><strong>${openCount}</strong> Open Slots</div>`;
            } else {
                bgClass = "bg-gray-100"; // Full
                dayContent += `<div class="mx-1 mt-1 text-xs text-gray-500 text-center">Full</div>`;
            }
        }

        // Click Handler
        const dateStr = `${String(day).padStart(2,'0')}.${String(month+1).padStart(2,'0')}.${year}`;
        const clickAction = slots.length > 0 ? `onclick="openDayModal('${dateStr}', '${myEmail}')"` : "";

        html += `<div class="border h-24 ${borderClass} ${bgClass} flex flex-col relative" ${clickAction}>${dayContent}</div>`;
    }
    ui.calGrid.innerHTML = html;
}

// --- DAY DETAIL MODAL ---
window.openDayModal = function(dateStr, email) {
    document.getElementById('modal-day-title').textContent = dateStr;
    const container = document.getElementById('modal-sessions-container');
    container.innerHTML = '';
    
    const sessions = Object.keys(invigilationSlots).filter(k => k.startsWith(dateStr));
    
    sessions.forEach(key => {
        const slot = invigilationSlots[key];
        const filled = slot.assigned.length;
        const needed = slot.required - filled;
        const isAssigned = slot.assigned.includes(email);
        const isUnavailable = slot.unavailable.includes(email);
        const isLocked = slot.isLocked;

        let actionHtml = "";
        
        if (isAssigned) {
            actionHtml = `<span class="text-green-600 font-bold text-sm flex items-center gap-1">✅ Assigned</span>`;
        } else if (isLocked) {
            actionHtml = `<span class="text-gray-400 text-xs font-bold">🔒 Locked by Admin</span>`;
        } else if (isUnavailable) {
             actionHtml = `
                <button onclick="setAvailability('${key}', '${email}', true)" class="text-xs text-blue-600 hover:underline">
                    Undo "Unavailable"
                </button>`;
        } else {
            // Volunteer Button (Only if slots open)
            if (needed > 0) {
                actionHtml = `
                    <div class="flex gap-2 w-full">
                        <button onclick="volunteer('${key}', '${email}')" class="flex-1 bg-indigo-600 text-white text-xs py-2 rounded font-bold hover:bg-indigo-700 shadow-sm transition">
                            Volunteer
                        </button>
                        <button onclick="setAvailability('${key}', '${email}', false)" class="flex-1 bg-white border border-red-300 text-red-600 text-xs py-2 rounded font-medium hover:bg-red-50">
                            Unavailable
                        </button>
                    </div>
                `;
            } else {
                actionHtml = `
                    <div class="flex justify-between items-center w-full">
                        <span class="text-xs text-gray-500 italic">Slots Full</span>
                        <button onclick="setAvailability('${key}', '${email}', false)" class="text-xs text-red-500 hover:underline">Mark Unavailable</button>
                    </div>
                `;
            }
        }

        container.innerHTML += `
            <div class="bg-gray-50 p-3 rounded border border-gray-200">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-bold text-gray-800">${key.split('|')[1]}</span>
                    <span class="text-xs bg-white border px-2 py-0.5 rounded ${needed > 0 ? 'text-green-600 border-green-200' : 'text-gray-400'}">${filled}/${slot.required} Filled</span>
                </div>
                <div class="flex items-center justify-between mt-2">
                    ${actionHtml}
                </div>
            </div>
        `;
    });

    window.openModal('day-detail-modal');
}


// --- DATA SYNC ---
async function syncSlotsToCloud() {
    const ref = doc(db, "colleges", currentCollegeId);
    await updateDoc(ref, { examInvigilationSlots: JSON.stringify(invigilationSlots) });
}

async function syncStaffToCloud() {
    const ref = doc(db, "colleges", currentCollegeId);
    await updateDoc(ref, { examStaffData: JSON.stringify(staffData) });
}

async function addUserToWhitelist(email) {
    try {
        const ref = doc(db, "colleges", currentCollegeId);
        await updateDoc(ref, { allowedUsers: arrayUnion(email) });
    } catch(e) { console.error(e); }
}

// --- HELPERS & ACTIONS ---

window.toggleLock = async function(key) {
    invigilationSlots[key].isLocked = !invigilationSlots[key].isLocked;
    await syncSlotsToCloud();
    renderSlotsGridAdmin();
}

window.volunteer = async function(key, email) {
    if(!confirm("Confirm duty for this session?")) return;
    invigilationSlots[key].assigned.push(email);
    // Update Staff Stats
    const me = staffData.find(s => s.email === email);
    if(me) me.dutiesAssigned = (me.dutiesAssigned || 0) + 1;
    
    await syncSlotsToCloud();
    await syncStaffToCloud(); // Save assigned stat
    window.closeModal('day-detail-modal');
    renderStaffCalendar(email);
    // Refresh header pending count
    const pending = calculateStaffTarget(me) - (me.dutiesDone || 0); // Note: pending usually excludes assigned future duties, but for now keep simple
    document.getElementById('staff-view-pending').textContent = pending > 0 ? pending : "0 (Done)";
}

window.setAvailability = async function(key, email, isAvailable) {
    if(isAvailable) {
        invigilationSlots[key].unavailable = invigilationSlots[key].unavailable.filter(e => e !== email);
    } else {
        const reason = prompt("Reason for unavailability (Optional):");
        if(reason === null) return; 
        invigilationSlots[key].unavailable.push(email);
    }
    await syncSlotsToCloud();
    window.closeModal('day-detail-modal');
    renderStaffCalendar(email);
}

window.waNotify = function(key) {
    const slot = invigilationSlots[key];
    if(slot.assigned.length === 0) return alert("No staff assigned.");
    const phones = slot.assigned.map(email => {
        const s = staffData.find(st => st.email === email);
        return s ? s.phone : "";
    }).filter(p => p);
    if(phones.length === 0) return alert("No phones found.");
    const msg = encodeURIComponent(`Exam Duty: You are assigned for ${key}.`);
    window.open(`https://wa.me/${phones[0]}?text=${msg}`, '_blank');
}

window.calculateSlotsFromSchedule = async function() {
    alert("Slots are automatically calculated from the Main App. Go to Main App > Room Allotment > Save to update.");
    // Refresh data
    const docRef = doc(db, "colleges", currentCollegeId);
    const snap = await getDoc(docRef);
    if(snap.exists()) {
        collegeData = snap.data();
        invigilationSlots = JSON.parse(collegeData.examInvigilationSlots || '{}');
        renderSlotsGridAdmin();
    }
}

window.runAutoAllocation = async function() {
    if(!confirm("Auto-Assign duties?")) return;
    let eligibleStaff = [...staffData].map(s => ({ ...s, pending: calculateStaffTarget(s) - (s.dutiesDone || 0) })).sort((a, b) => b.pending - a.pending);
    let assignedCount = 0;
    for (const sessionKey in invigilationSlots) {
        const slot = invigilationSlots[sessionKey];
        if(slot.isLocked) continue;
        const needed = slot.required - slot.assigned.length;
        if (needed <= 0) continue;
        
        const [dateStr] = sessionKey.split(' | ');
        const parts = dateStr.split('.');
        const examDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        const dayOfWeek = examDate.getDay(); 

        for (let i = 0; i < needed; i++) {
            const candidate = eligibleStaff.find(s => {
                if (slot.assigned.includes(s.email)) return false;
                if (slot.unavailable.includes(s.email)) return false;
                if (s.designation === "Guest Lecturer" && s.preferredDays && !s.preferredDays.includes(dayOfWeek)) return false;
                return true;
            });
            if (candidate) {
                slot.assigned.push(candidate.email);
                candidate.pending--; 
                eligibleStaff.sort((a, b) => b.pending - a.pending);
                assignedCount++;
            }
        }
    }
    await syncSlotsToCloud();
    renderSlotsGridAdmin();
    alert(`Assigned ${assignedCount} duties.`);
}

function renderSlotsGridAdmin() {
    if(!ui.adminSlotsGrid) return;
    ui.adminSlotsGrid.innerHTML = '';
    Object.keys(invigilationSlots).sort().forEach(key => {
        const slot = invigilationSlots[key];
        const filled = slot.assigned.length;
        const statusColor = filled >= slot.required ? "border-green-400 bg-green-50" : "border-orange-300 bg-orange-50";
        ui.adminSlotsGrid.innerHTML += `
            <div class="border-l-4 ${statusColor} bg-white p-4 rounded shadow-sm slot-card">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-gray-800 text-sm">${key}</h4>
                    <span class="text-xs font-bold px-2 py-1 rounded bg-white border">${filled} / ${slot.required}</span>
                </div>
                <div class="text-xs text-gray-600 mb-3"><strong>Assigned:</strong> ${slot.assigned.map(email => getNameFromEmail(email)).join(', ') || "None"}</div>
                <div class="flex gap-2">
                    <button onclick="toggleLock('${key}')" class="flex-1 text-xs border border-gray-300 rounded py-1 hover:bg-gray-50">${slot.isLocked ? '🔒 Unlock' : '🔓 Lock'}</button>
                    <button onclick="waNotify('${key}')" class="flex-1 text-xs bg-green-600 text-white rounded py-1 hover:bg-green-700">WhatsApp</button>
                </div>
            </div>
        `;
    });
}

function getCurrentAcademicYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); 
    let startYear = (month < 5) ? year - 1 : year;
    return { label: `${startYear}-${startYear+1}`, start: new Date(startYear, 5, 1), end: new Date(startYear+1, 4, 31) };
}

function calculateStaffTarget(staff) {
    const roleTarget = designationsConfig[staff.designation] || 2;
    if (staff.roleHistory) {
        const today = new Date();
        const active = staff.roleHistory.find(r => new Date(r.start) <= today && new Date(r.end) >= today);
        if(active && rolesConfig[active.role] !== undefined) return rolesConfig[active.role] * 5; 
    }
    return roleTarget * 5; 
}

function getNameFromEmail(email) {
    const s = staffData.find(st => st.email === email);
    return s ? s.name.split(' ')[0] : email.split('@')[0];
}

window.openModal = (id) => document.getElementById(id).classList.remove('hidden');
window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

window.saveNewStaff = async function() {
    const name = document.getElementById('stf-name').value;
    const email = document.getElementById('stf-email').value;
    const phone = document.getElementById('stf-phone').value;
    const dept = document.getElementById('stf-dept').value;
    const designation = document.getElementById('stf-designation').value;
    const date = document.getElementById('stf-join').value;
    if(!name || !email) return alert("Fill all fields");
    
    const days = [];
    document.querySelectorAll('.day-chk:checked').forEach(chk => days.push(parseInt(chk.value)));

    const newObj = { name, email, phone, dept, designation, joiningDate: date, dutiesDone: 0, roleHistory: [], preferredDays: days };
    staffData.push(newObj);
    await syncStaffToCloud();
    await addUserToWhitelist(email);
    window.closeModal('add-staff-modal');
    renderStaffTable();
}

window.deleteStaff = async function(index) {
    if(confirm("Delete staff?")) {
        staffData.splice(index, 1);
        await syncStaffToCloud();
        renderStaffTable();
    }
}

window.openRoleAssignmentModal = function(index) {
    const staff = staffData[index];
    const modal = document.getElementById('role-assignment-modal');
    document.getElementById('role-assign-name').textContent = staff.name;
    document.getElementById('role-assign-index').value = index;
    const select = document.getElementById('assign-role-select');
    select.innerHTML = Object.keys(rolesConfig).map(r => `<option value="${r}">${r}</option>`).join('');
    const hist = document.getElementById('role-history-list');
    hist.innerHTML = (staff.roleHistory || []).map((h, i) => `<div class="flex justify-between text-xs p-1 bg-gray-50 mb-1"><span>${h.role}</span> <button onclick="removeRole(${index},${i})" class="text-red-500">&times;</button></div>`).join('');
    modal.classList.remove('hidden');
}

window.saveRoleAssignment = async function() {
    const idx = document.getElementById('role-assign-index').value;
    const role = document.getElementById('assign-role-select').value;
    const start = document.getElementById('assign-start-date').value;
    const end = document.getElementById('assign-end-date').value;
    if(!start) return alert("Dates required");
    if(!staffData[idx].roleHistory) staffData[idx].roleHistory = [];
    staffData[idx].roleHistory.push({ role, start, end });
    await syncStaffToCloud();
    window.closeModal('role-assignment-modal');
    renderStaffTable();
}

window.removeRole = async function(sIdx, rIdx) {
    staffData[sIdx].roleHistory.splice(rIdx, 1);
    await syncStaffToCloud();
    window.closeModal('role-assignment-modal');
    renderStaffTable();
}

window.filterStaffTable = renderStaffTable;
window.switchAdminTab = function(tabName) {
    document.getElementById('tab-content-staff').classList.add('hidden');
    document.getElementById('tab-content-slots').classList.add('hidden');
    document.getElementById('tab-btn-staff').classList.replace('border-indigo-600', 'border-transparent');
    document.getElementById('tab-btn-slots').classList.replace('border-indigo-600', 'border-transparent');
    document.getElementById(`tab-content-${tabName}`).classList.remove('hidden');
    document.getElementById(`tab-btn-${tabName}`).classList.replace('border-transparent', 'border-indigo-600');
}

function showView(viewName) {
    Object.values(views).forEach(el => el.classList.add('hidden'));
    views[viewName].classList.remove('hidden');
}
