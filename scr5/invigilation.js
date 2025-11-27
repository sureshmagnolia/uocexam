// invigilation.js
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = window.firebase.auth;
const db = window.firebase.db;
const provider = window.firebase.provider;

// --- CONFIGURATION & DEFAULTS ---
// 1. Base Designations (Permanent status)
const DEFAULT_DESIGNATIONS = {
    "Assistant Professor": 2, // Base Target per month
    "Associate Professor": 1,
    "Guest Lecturer": 4,
    "Professor": 0
};

// 2. Functional Roles (Temporary/Yearly overrides)
const DEFAULT_ROLES = {
    "Vice Principal": 0,  // Exempt
    "HOD": 1,             // Reduced
    "NSS Officer": 1,
    "Warden": 0,
    "PTA Secretary": 1,
    "Exam Chief": 0
};

// --- STATE ---
let currentUser = null;
let currentCollegeId = null;
let collegeData = null;
let staffData = [];
let designationsConfig = {};
let rolesConfig = {};

// --- DOM ELEMENTS ---
const views = {
    login: document.getElementById('view-login'),
    admin: document.getElementById('view-admin'),
    staff: document.getElementById('view-staff')
};

const ui = {
    headerName: document.getElementById('header-college-name'),
    authSection: document.getElementById('auth-section'),
    userName: document.getElementById('user-name'),
    userRole: document.getElementById('user-role'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    staffTableBody: document.getElementById('staff-table-body'),
    
    // Modals
    roleAssignmentModal: document.getElementById('role-assignment-modal'),
    
    // Stats
    lblAcademicYear: document.getElementById('lbl-academic-year')
};

// --- HELPER: Date & Academic Year ---

function getCurrentAcademicYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    
    // Academic Year starts June 1st
    // If Month is Jan-May (0-4), we are in the second half of (Year-1)-(Year)
    // If Month is June-Dec (5-11), we are in the first half of (Year)-(Year+1)
    
    let startYear = (month < 5) ? year - 1 : year;
    let endYear = startYear + 1;
    
    return {
        label: `${startYear}-${endYear}`,
        start: new Date(startYear, 5, 1), // June 1st
        end: new Date(endYear, 4, 31)     // May 31st
    };
}

// --- CALCULATION ENGINE ---

function calculateStaffTarget(staff) {
    const acYear = getCurrentAcademicYear();
    const today = new Date();
    
    // Cap the calculation end date to Today (we don't accrue debt for future months yet)
    // OR do we set target for whole year? Usually "Pending" implies "Up to now".
    // Let's calculate "Target Accrued Up To Today".
    
    const calcEnd = (today < acYear.end) ? today : acYear.end;
    const calcStart = (new Date(staff.joiningDate) > acYear.start) ? new Date(staff.joiningDate) : acYear.start;

    if (calcStart > calcEnd) return 0; // Joined in future

    let totalTarget = 0;
    let cursor = new Date(calcStart);
    
    // Iterate month by month
    while (cursor < calcEnd) {
        const currentMonthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const currentMonthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
        
        // 1. Determine Active Rule for this month
        // Default: Designation Target
        let monthlyTarget = designationsConfig[staff.designation] || 2;
        
        // 2. Check for Functional Role Override
        if (staff.roleHistory && staff.roleHistory.length > 0) {
            // Check if any role covers this month
            staff.roleHistory.forEach(roleAssign => {
                const roleStart = new Date(roleAssign.start);
                const roleEnd = new Date(roleAssign.end);
                
                // If role is active during this month
                if (roleStart <= currentMonthEnd && roleEnd >= currentMonthStart) {
                    // Apply Override if role exists in config
                    if (rolesConfig[roleAssign.role] !== undefined) {
                        monthlyTarget = rolesConfig[roleAssign.role];
                    }
                }
            });
        }

        totalTarget += monthlyTarget;
        
        // Move to next month
        cursor.setMonth(cursor.getMonth() + 1);
    }

    return totalTarget;
}


// --- AUTHENTICATION FLOW ---

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await handleLogin(user);
    } else {
        currentUser = null;
        showView('login');
        ui.authSection.classList.add('hidden');
    }
});

ui.loginBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch((error) => {
        document.getElementById('login-status').textContent = "Login failed: " + error.message;
    });
});

ui.logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => window.location.reload());
});


// --- CORE LOGIC ---

async function handleLogin(user) {
    ui.loginBtn.innerText = "Verifying Access...";
    
    const collegesRef = collection(db, "colleges");
    const q = query(collegesRef, where("allowedUsers", "array-contains", user.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        currentCollegeId = docSnap.id;
        collegeData = docSnap.data();
        initAdminDashboard();
    } else {
        // Fallback: Check if Staff via URL ID
        const urlParams = new URLSearchParams(window.location.search);
        const urlId = urlParams.get('id');
        if (urlId) {
            await checkStaffAccess(urlId, user.email);
        } else {
            alert("Access Denied. Admin access not found, and no College ID provided.");
            signOut(auth);
        }
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
        } else {
            alert("Access Denied: Email not found in staff list.");
            signOut(auth);
        }
    } else {
        alert("Invalid College Link.");
        signOut(auth);
    }
}

// --- ADMIN DASHBOARD ---

function initAdminDashboard() {
    ui.headerName.textContent = collegeData.examCollegeName;
    ui.userName.textContent = currentUser.displayName;
    ui.userRole.textContent = "ADMIN";
    ui.authSection.classList.remove('hidden');
    
    // Load Configs (or set defaults)
    designationsConfig = JSON.parse(collegeData.invigDesignations || JSON.stringify(DEFAULT_DESIGNATIONS));
    rolesConfig = JSON.parse(collegeData.invigRoles || JSON.stringify(DEFAULT_ROLES));
    staffData = JSON.parse(collegeData.examStaffData || '[]');

    updateAdminUI();
    showView('admin');
}

function updateAdminUI() {
    // Update Stats
    document.getElementById('stat-total-staff').textContent = staffData.length;
    
    // Update Academic Year Display
    const acYear = getCurrentAcademicYear();
    if(ui.lblAcademicYear) ui.lblAcademicYear.textContent = `AY: ${acYear.label}`;
    
    // Populate Dropdowns for Add Modal
    const desigSelect = document.getElementById('stf-designation');
    desigSelect.innerHTML = Object.keys(designationsConfig).map(r => `<option value="${r}">${r} (${designationsConfig[r]}/mo)</option>`).join('');
    
    renderStaffTable();
}

function renderStaffTable() {
    ui.staffTableBody.innerHTML = '';
    const filter = document.getElementById('staff-search').value.toLowerCase();

    staffData.forEach((staff, index) => {
        if (filter && !staff.name.toLowerCase().includes(filter)) return;

        // 1. Calculate Targets
        const target = calculateStaffTarget(staff);
        const done = staff.dutiesDone || 0; // Need to track this per AY ideally
        const pending = target - done;
        
        // 2. Get Current Active Role Label
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
            <td class="px-6 py-3">
                <div class="flex items-center">
                    <div class="h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs mr-3">
                        ${staff.name.charAt(0)}
                    </div>
                    <div>
                        <div class="text-sm font-bold text-gray-800">${staff.name}</div>
                        <div class="text-xs text-gray-500">${staff.designation} ${activeRoleLabel}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-3 text-center font-mono text-sm text-gray-600">${target}</td>
            <td class="px-6 py-3 text-center font-mono text-sm font-bold">${done}</td>
            <td class="px-6 py-3 text-center font-mono text-sm ${statusColor}">${pending}</td>
            <td class="px-6 py-3 text-right text-xs font-medium flex justify-end gap-2">
                <button onclick="openRoleAssignmentModal(${index})" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded">Assign Role</button>
                <button onclick="deleteStaff(${index})" class="text-red-500 hover:text-red-700">&times;</button>
            </td>
        `;
        ui.staffTableBody.appendChild(row);
    });
}

// --- MODAL: ROLE ASSIGNMENT ---

window.openRoleAssignmentModal = function(index) {
    const staff = staffData[index];
    const modal = document.getElementById('role-assignment-modal');
    
    document.getElementById('role-assign-name').textContent = staff.name;
    document.getElementById('role-assign-index').value = index;
    
    // Populate Role Options
    const select = document.getElementById('assign-role-select');
    select.innerHTML = Object.keys(rolesConfig).map(r => `<option value="${r}">${r} (Target: ${rolesConfig[r]})</option>`).join('');
    
    // Set Default Dates (Current AY)
    const acYear = getCurrentAcademicYear();
    document.getElementById('assign-start-date').valueAsDate = new Date(); // Today
    document.getElementById('assign-end-date').valueAsDate = acYear.end;   // End of AY
    
    // Render History
    const historyList = document.getElementById('role-history-list');
    historyList.innerHTML = '';
    if (staff.roleHistory && staff.roleHistory.length > 0) {
        staff.roleHistory.forEach((h, hIndex) => {
            historyList.innerHTML += `
                <div class="flex justify-between items-center text-xs bg-gray-50 p-2 rounded mb-1">
                    <span><b>${h.role}</b> (${h.start} to ${h.end})</span>
                    <button onclick="removeRoleFromStaff(${index}, ${hIndex})" class="text-red-500">&times;</button>
                </div>
            `;
        });
    } else {
        historyList.innerHTML = '<p class="text-gray-400 text-xs italic">No functional roles assigned.</p>';
    }

    modal.classList.remove('hidden');
}

window.saveRoleAssignment = async function() {
    const index = document.getElementById('role-assign-index').value;
    const role = document.getElementById('assign-role-select').value;
    const start = document.getElementById('assign-start-date').value;
    const end = document.getElementById('assign-end-date').value;
    
    if (!start || !end) return alert("Select dates");
    
    const staff = staffData[index];
    if (!staff.roleHistory) staff.roleHistory = [];
    
    staff.roleHistory.push({ role, start, end });
    
    await syncStaffToCloud();
    closeModal('role-assignment-modal');
    renderStaffTable();
}

window.removeRoleFromStaff = async function(staffIndex, roleIndex) {
    if(confirm("Remove this role assignment?")) {
        staffData[staffIndex].roleHistory.splice(roleIndex, 1);
        await syncStaffToCloud();
        // Re-open modal to refresh list logic is complex, easier to just close and refresh table
        closeModal('role-assignment-modal');
        renderStaffTable();
    }
}

// --- ACTIONS ---

window.saveNewStaff = async function() {
    const name = document.getElementById('stf-name').value;
    const email = document.getElementById('stf-email').value;
    const phone = document.getElementById('stf-phone').value;
    const dept = document.getElementById('stf-dept').value;
    const designation = document.getElementById('stf-designation').value; // Base Role
    const date = document.getElementById('stf-join').value;

    if(!name || !email || !date) return alert("Fill all fields");

    const newObj = {
        name, email, phone, dept, designation, 
        joiningDate: date,
        dutiesDone: 0, 
        roleHistory: [] // Array for Warden, VP, etc.
    };

    staffData.push(newObj);
    await syncStaffToCloud();
    
    // Auto Whitelist
    await addUserToWhitelist(email);
    
    closeModal('add-staff-modal');
    renderStaffTable();
}

window.deleteStaff = async function(index) {
    if(confirm("Delete this staff member?")) {
        staffData.splice(index, 1);
        await syncStaffToCloud();
        renderStaffTable();
    }
}

async function syncStaffToCloud() {
    if(!currentCollegeId) return;
    const ref = doc(db, "colleges", currentCollegeId);
    await updateDoc(ref, { examStaffData: JSON.stringify(staffData) });
}

// --- HELPERS ---
async function addUserToWhitelist(email) {
    const { db, doc, updateDoc, arrayUnion } = window.firebase;
    try {
        const docRef = doc(db, "colleges", currentCollegeId);
        await updateDoc(docRef, { allowedUsers: arrayUnion(email) });
    } catch(e) { console.error(e); }
}

window.openModal = (id) => document.getElementById(id).classList.remove('hidden');
window.closeModal = (id) => document.getElementById(id).classList.add('hidden');
window.filterStaffTable = renderStaffTable;

function showView
