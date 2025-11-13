// --- Global localStorage Key ---
const ROOM_CONFIG_KEY = 'examRoomConfig';
const COLLEGE_NAME_KEY = 'examCollegeName';
const ABSENTEE_LIST_KEY = 'examAbsenteeList';
const QP_CODE_LIST_KEY = 'examQPCodes';
const BASE_DATA_KEY = 'examBaseData';
const ROOM_ALLOTMENT_KEY = 'examRoomAllotment';
// *** NEW SCRIBE KEYS ***
const SCRIBE_LIST_KEY = 'examScribeList';
const SCRIBE_ALLOTMENT_KEY = 'examScribeAllotment';
// ***********************

// --- Global var to hold data from the last *report run* ---
let lastGeneratedRoomData = [];
let lastGeneratedReportType = "";

// --- (V28) Global var to hold room config map for report generation ---
let currentRoomConfig = {};

// --- (V48) Global var for college name ---
let currentCollegeName = "University of Calicut";

// --- (V56) Global var for absentee data ---
let allStudentData = []; // Holds all students from PDF/CSV
let allStudentSessions = []; // Holds unique sessions
let currentAbsenteeList = [];
let selectedStudent = null;

// --- (V58) Global var for QP Code data ---
let qpCodeMap = {}; 

// --- Room Allotment Data ---
let currentSessionAllotment = [];
let currentSessionKey = '';

// *** NEW SCRIBE GLOBALS ***
let globalScribeList = []; // Array of { regNo: "...", name: "..." }
let currentScribeAllotment = {}; // For the selected session, { regNo: "RoomName" }
let studentToAllotScribeRoom = null; // Holds regNo of student being allotted
// **************************


// --- Get references to all Report elements ---
const generateReportButton = document.getElementById('generate-report-button');
const jsonDataStore = document.getElementById('json-data-store');
const reportControls = document.getElementById('report-controls');
const reportOutputArea = document.getElementById('report-output-area');
const reportStatus = document.getElementById('report-status');
const finalPrintButton = document.getElementById('final-print-button');
const clearReportButton = document.getElementById('clear-report-button');
const roomCsvDownloadContainer = document.getElementById('room-csv-download-container');

// --- Get references to all Navigation elements ---
const viewExtractor = document.getElementById('view-extractor');
const viewSettings = document.getElementById('view-settings');
const viewQPCodes = document.getElementById('view-qpcodes');
const viewReports = document.getElementById('view-reports');
const viewAbsentees = document.getElementById('view-absentees');
// const viewRoomSettings = document.getElementById('view-room-settings'); // <-- No longer a main view
const navExtractor = document.getElementById('nav-extractor');
const navSettings = document.getElementById('nav-settings');
const navQPCodes = document.getElementById('nav-qpcodes');
const navReports = document.getElementById('nav-reports');
const navAbsentees = document.getElementById('nav-absentees');
// const navRoomSettings = document.getElementById('nav-room-settings'); // <-- No longer a main view
// *** NEW SCRIBE NAV ***
const navScribeSettings = document.getElementById('nav-scribe-settings');
const navScribeAllotment = document.getElementById('nav-scribe-allotment');
// **********************
const navRoomAllotment = document.getElementById('nav-room-allotment');
const viewRoomAllotment = document.getElementById('view-room-allotment');
// *** NEW SCRIBE VIEWS ***
const viewScribeSettings = document.getElementById('view-scribe-settings');
const viewScribeAllotment = document.getElementById('view-scribe-allotment');
// **********************
// *** UPDATED allNavButtons and allViews TO MATCH NEW ORDER ***
const allNavButtons = [navExtractor, navScribeSettings, navRoomAllotment, navScribeAllotment, navQPCodes, navReports, navAbsentees, navSettings];
const allViews = [viewExtractor, viewScribeSettings, viewRoomAllotment, viewScribeAllotment, viewQPCodes, viewReports, viewAbsentees, viewSettings];

// --- (V26) Get references to NEW Room Settings elements (Now in Settings Tab) ---
const collegeNameInput = document.getElementById('college-name-input');
const saveCollegeNameButton = document.getElementById('save-college-name-button'); 
const collegeNameStatus = document.getElementById('college-name-status');
const roomConfigContainer = document.getElementById('room-config-container');
const addRoomButton = document.getElementById('add-room-button');
const saveRoomConfigButton = document.getElementById('save-room-config-button');
const roomConfigStatus = document.getElementById('room-config-status');

// --- Get references to Q-Paper Report elements ---
const qPaperDataStore = document.getElementById('q-paper-data-store');
const generateQPaperReportButton = document.getElementById('generate-qpaper-report-button');
// *** NEW SCRIBE REPORT BUTTON ***
const generateScribeReportButton = document.getElementById('generate-scribe-report-button');
// ****************************

// --- Get references to Day-wise Report elements ---
const generateDaywiseReportButton = document.getElementById('generate-daywise-report-button');

// --- Get references to CSV Upload elements ---
const correctedCsvUpload = document.getElementById('corrected-csv-upload');
const loadCsvButton = document.getElementById('load-csv-button');
const csvLoadStatus = document.getElementById('csv-load-status');

// --- (V56) Get references to Absentee elements ---
const absenteeLoader = document.getElementById('absentee-loader');
const absenteeContentWrapper = document.getElementById('absentee-content-wrapper');
const sessionSelect = document.getElementById('session-select');
const absenteeSearchSection = document.getElementById('absentee-search-section');
const absenteeSearchInput = document.getElementById('absentee-search');
const autocompleteResults = document.getElementById('autocomplete-results');
const selectedStudentDetails = document.getElementById('selected-student-details');
const selectedStudentName = document.getElementById('selected-student-name');
const selectedStudentCourse = document.getElementById('selected-student-course');
const selectedStudentRoom = document.getElementById('selected-student-room');
const addAbsenteeButton = document.getElementById('add-absentee-button');
const absenteeListSection = document.getElementById('absentee-list-section');
const currentAbsenteeListDiv = document.getElementById('current-absentee-list');
const generateAbsenteeReportButton = document.getElementById('generate-absentee-report-button');

// --- (V58) Get references to QP Code elements ---
const qpcodeLoader = document.getElementById('qpcode-loader');
const qpcodeContentWrapper = document.getElementById('qpcode-content-wrapper');
const sessionSelectQP = document.getElementById('session-select-qp');
const qpEntrySection = document.getElementById('qp-entry-section');
const qpCodeContainer = document.getElementById('qp-code-container');
const qpCodeStatus = document.getElementById('qp-code-status');
const saveQpCodesButton = document.getElementById('save-qp-codes-button');

// --- V68 Report Filter Elements ---
const reportFilterSection = document.getElementById('report-filter-section');
const filterAllRadio = document.getElementById('filter-all');
const filterSessionRadio = document.getElementById('filter-session');
const reportsSessionDropdownContainer = document.getElementById('reports-session-dropdown-container');
const reportsSessionSelect = document.getElementById('reports-session-select');

// --- Room Allotment Elements ---
const roomAllotmentLoader = document.getElementById('room-allotment-loader');
const roomAllotmentContentWrapper = document.getElementById('room-allotment-content-wrapper');
const allotmentSessionSelect = document.getElementById('allotment-session-select');
const allotmentStudentCountSection = document.getElementById('allotment-student-count-section');
const totalStudentsCount = document.getElementById('total-students-count');
const remainingStudentsCount = document.getElementById('remaining-students-count');
const allottedStudentsCount = document.getElementById('allotted-students-count');
const addRoomSection = document.getElementById('add-room-section');
const addRoomAllotmentButton = document.getElementById('add-room-allotment-button');
const roomSelectionModal = document.getElementById('room-selection-modal');
const roomSelectionList = document.getElementById('room-selection-list');
const closeRoomModal = document.getElementById('close-room-modal');
const allottedRoomsSection = document.getElementById('allotted-rooms-section');
const allottedRoomsList = document.getElementById('allotted-rooms-list');
const saveAllotmentSection = document.getElementById('save-allotment-section');
const saveRoomAllotmentButton = document.getElementById('save-room-allotment-button');
const roomAllotmentStatus = document.getElementById('room-allotment-status');

// *** NEW SCRIBE SETTINGS ELEMENTS ***
const scribeLoader = document.getElementById('scribe-loader');
const scribeContentWrapper = document.getElementById('scribe-content-wrapper');
const scribeSearchInput = document.getElementById('scribe-search');
const scribeAutocompleteResults = document.getElementById('scribe-autocomplete-results');
const scribeSelectedStudentDetails = document.getElementById('scribe-selected-student-details');
const scribeSelectedStudentName = document.getElementById('scribe-selected-student-name');
const scribeSelectedStudentRegno = document.getElementById('scribe-selected-student-regno');
const addScribeStudentButton = document.getElementById('add-scribe-student-button');
const currentScribeListDiv = document.getElementById('current-scribe-list');
// ************************************

// *** NEW SCRIBE ALLOTMENT ELEMENTS ***
const scribeAllotmentLoader = document.getElementById('scribe-allotment-loader');
const scribeAllotmentContentWrapper = document.getElementById('scribe-allotment-content-wrapper');
const scribeSessionSelect = document.getElementById('scribe-session-select');
const scribeAllotmentListSection = document.getElementById('scribe-allotment-list-section');
const scribeAllotmentList = document.getElementById('scribe-allotment-list');
const scribeRoomModal = document.getElementById('scribe-room-modal');
const scribeRoomModalTitle = document.getElementById('scribe-room-modal-title');
const scribeRoomSelectionList = document.getElementById('scribe-room-selection-list');
const scribeCloseRoomModal = document.getElementById('scribe-close-room-modal');
// *************************************
// *** NEW RESET BUTTONS ***
const resetStudentDataButton = document.getElementById('reset-student-data-button');
const masterResetButton = document.getElementById('master-reset-button');
// *************************


// --// V90 FIX: Aggressive Key Cleaning Function (Fixes key collision) ---
function cleanCourseKey(courseName) {
    if (typeof courseName !== 'string') return '';
    // V90 FIX: Keep only alphanumeric characters and the course code part
    // The course code is the most unique part (e.g., BOT3CJ201)
    let cleaned = courseName.toUpperCase();
    
    // 1. Extract the course code (e.g., BOT3CJ201) and the syllabus year (e.g., 2024)
    const codeMatch = cleaned.match(/([A-Z]{3}\d[A-Z]{2}\d{3})/);
    const syllabusMatch = cleaned.match(/(\d{4})\s+SYLLABUS/);
    
    let key = '';
    if (codeMatch) {
        key += codeMatch[1];
    }
    if (syllabusMatch) {
        key += syllabusMatch[1];
    }
    
    // Fallback: If no code is found, use the old aggressive cleaning method
    if (!key) {
        // Remove all non-standard chars (including BOM, non-breaking spaces, and control chars)
        cleaned = cleaned.replace(/[\ufeff\u00A0\u200B\u200C\u200D\u200E\u200F\uFEFF]/g, ' ').toUpperCase(); 
        // Remove ALL non-alphanumeric chars (except spaces, - ( ) [ ] / & , ; .)
        cleaned = cleaned.replace(/[^\w\s\-\(\)\[\]\/&,;.]/g, ''); 
        // Replace multiple spaces with one, then trim
        key = cleaned.replace(/\s+/g, ' ').trim();
    }
    
    return key;
} 

// --- Helper function to numerically sort room keys ---
function getNumericSortKey(key) {
    const parts = key.split('_'); // Date_Time_Room 1
    const roomPart = parts[2] || "Room 0";
    // V100 FIX: Handle "SCRIBE_ROOM_N/A"
    if (roomPart.startsWith('SCRIBE')) {
        return `${parts[0]}_${parts[1]}_Room_9999_SCRIBE`; // Ensure scribes sort last
    }
    const roomNumber = parseInt(roomPart.replace('Room ', ''), 10);
    return `${parts[0]}_${parts[1]}_${String(roomNumber).padStart(4, '0')}`;
}

// --- (V28) Helper function to create a new room row HTML (with location) ---
function createRoomRowHtml(roomName, capacity, location, isLast = false) {
    const removeButtonHtml = isLast ? 
        `<button class="remove-room-button ml-auto text-sm text-red-600 hover:text-red-800 font-medium">&times; Remove</button>` : 
        `<div class="w-[84px]"></div>`; // Placeholder for alignment
    
    return `
        <div class="room-row flex items-center gap-3 p-2 border-b border-gray-200" data-room-name="${roomName}">
            <label class="room-name-label font-medium text-gray-700 w-24 shrink-0">${roomName}:</label>
            <input type="number" class="room-capacity-input block w-20 p-2 border border-gray-300 rounded-md shadow-sm text-sm" value="${capacity}" min="1" placeholder="30">
            <input type="text" class="room-location-input block flex-grow p-2 border border-gray-300 rounded-md shadow-sm text-sm" value="${location}" placeholder="e.g., Commerce Block">
            ${removeButtonHtml}
        </div>
    `;
}

// --- (V69) FIX: Robust Room Config Loading (handles NULL) ---
function getRoomCapacitiesFromStorage() {
    // V48: Load College Name (Read, but do not update UI here)
    currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
    
    // Load Room Config
    let savedConfigJson = localStorage.getItem(ROOM_CONFIG_KEY);
    let roomConfig = {}; // V69: Initialize to empty object to prevent crash
    
    if (savedConfigJson) {
        try {
            roomConfig = JSON.parse(savedConfigJson);
        } catch (e) {
            console.error("Error parsing room config from localStorage:", e);
            // roomConfig already {}
        }
    }
    
    // (V28) Store in global var for report generation
    currentRoomConfig = roomConfig; 
    
    let roomNames = [];
    let roomCapacities = [];
    
    if (!roomConfig || Object.keys(roomConfig).length === 0) {
        // *** (V27): Default to 30 rooms ***
        console.log("Using default room config (30 rooms of 30)");
        let config = {};
        for (let i = 1; i <= 30; i++) {
            config[`Room ${i}`] = { capacity: 30, location: "" };
        }
        localStorage.setItem(ROOM_CONFIG_KEY, JSON.stringify(config));
        currentRoomConfig = config; // Update global var
        roomConfig = config; // V100 FIX: ensure roomConfig is set
    } 
    
    // (V100) This logic should now always run
    console.log("Using saved room config:", roomConfig);
    const sortedRoomKeys = Object.keys(roomConfig).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
    });
    roomNames = sortedRoomKeys;
    // (V28) Get capacity from the new object structure
    roomCapacities = sortedRoomKeys.map(key => roomConfig[key].capacity);

    return { roomNames, roomCapacities };
}

// --- *** NEW CENTRAL ALLOCATION FUNCTION (CORRECTED) *** ---
// This function performs the *original* (non-scribe) allotment and assigns
// a definitive seat number to every student.
//
// *** FIX (V3): Scribes now CONSUME a capacity slot in their
//     original room but are NOT given a seat number.
//
function performOriginalAllocation(data) {
    // 1. Get CURRENT room capacities
    const { roomNames: masterRoomNames, roomCapacities: masterRoomCaps } = getRoomCapacitiesFromStorage();
    
    // 2. Check for manual room allotments
    const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');

    // 3. Get Scribe List (to mark them)
    const scribeRegNos = new Set( (JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]')).map(s => s.regNo) );
    
    // 4. Perform Room Allocation
    const processed_rows_with_rooms = [];
    const sessionRoomFills = {}; // Tracks { "Room 1": 0, "Room 2": 0 }
    const sessionRoomStudentCount = {}; // Tracks { "Room 1": 0, "Room 2": 0 } for seat number
    const DEFAULT_OVERFLOW_CAPACITY = 30;
    
    for (const row of data) {
        const sessionKey = `${row.Date}_${row.Time}`;
        const sessionKeyPipe = `${row.Date} | ${row.Time}`;
        
        let assignedRoomName = "";
        
        // 4a. Check if student is a scribe.
        const isScribe = scribeRegNos.has(row['Register Number']);
        
        // 4b. Check if manual allotment exists for this session
        const manualAllotment = allAllotments[sessionKeyPipe];
        if (manualAllotment && manualAllotment.length > 0) {
            for (const room of manualAllotment) {
                if (room.students.includes(row['Register Number'])) {
                    assignedRoomName = room.roomName;
                    break;
                }
            }
        }
        
        // 4c. If no manual allotment, use automatic allocation
        if (assignedRoomName === "") {
            if (!sessionRoomFills[sessionKey]) {
                sessionRoomFills[sessionKey] = new Array(masterRoomCaps.length).fill(0);
            }
            
            const currentFills = sessionRoomFills[sessionKey];
            
            // Try to fill configured rooms
            for (let i = 0; i < masterRoomCaps.length; i++) {
                if (currentFills[i] < masterRoomCaps[i]) {
                    assignedRoomName = masterRoomNames[i];
                    // *** FIX: Increment fill count for ALL students (including scribes) ***
                    currentFills[i]++;
                    break;
                }
            }
            
            // If all configured rooms are full, create overflow
            if (assignedRoomName === "") {
                let foundOverflowSpot = false;
                for (let i = masterRoomCaps.length; i < currentFills.length; i++) {
                    if (currentFills[i] < DEFAULT_OVERFLOW_CAPACITY) {
                        assignedRoomName = `Room ${i + 1}`;
                        // *** FIX: Increment fill count for ALL students (including scribes) ***
                        currentFills[i]++;
                        foundOverflowSpot = true;
                        break;
                    }
                }
                
                // If no existing overflow has space, create a *new* overflow
                if (!foundOverflowSpot) {
                    assignedRoomName = `Room ${currentFills.length + 1}`;
                    // *** FIX: Increment fill count for ALL students (including scribes) ***
                    currentFills.push(1); 
                }
            }
        }
        
        // 4d. Assign the *original* seat number
        const roomSessionKey = `${sessionKey}_${assignedRoomName}`;
        if (!sessionRoomStudentCount[roomSessionKey]) {
            sessionRoomStudentCount[roomSessionKey] = 0;
        }

        // *** THIS IS THE CORE FIX ***
        let seatNumber = 0; // Scribes get 0
        if (!isScribe) {
            // Only non-scribes get a real seat number
            sessionRoomStudentCount[roomSessionKey]++;
            seatNumber = sessionRoomStudentCount[roomSessionKey];
        }
        // ***************************

        processed_rows_with_rooms.push({ 
            ...row, 
            'Room No': assignedRoomName,
            'seatNumber': seatNumber, // Scribes will have 0, others 1, 2, 3...
            'isScribe': isScribe 
        });
    }
    return processed_rows_with_rooms;
}
// --- V68: Helper function to filter data based on selected report filter ---
function getFilteredReportData(reportType) {
    const data = JSON.parse(jsonDataStore.innerHTML || '[]');
    if (data.length === 0) return [];
    
    if (filterAllRadio.checked) {
        // Return all data
        return data;
    } else if (filterSessionRadio.checked) {
        const sessionKey = reportsSessionSelect.value;
        if (!sessionKey || sessionKey === 'all') { // Fallback if somehow 'all' is selected here
            return data; 
        }
        const [date, time] = sessionKey.split(' | ');
        
        // Filter by selected session
        return data.filter(s => s.Date === date && s.Time === time);
    }
    return [];
}


// --- 1. Event listener for the "Generate Room-wise Report" button (CORRECTED) ---
generateReportButton.addEventListener('click', async () => {
    
    generateReportButton.disabled = true;
    generateReportButton.textContent = "Allocating Rooms & Generating Report...";
    reportOutputArea.innerHTML = "";
    reportControls.classList.add('hidden');
    roomCsvDownloadContainer.innerHTML = "";
    lastGeneratedRoomData = [];
    lastGeneratedReportType = ""; // V91: Reset report type
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        // *** V95 FIX: Refresh college name from local storage BEFORE generation ***
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        
        // 1. Get FILTERED RAW student data
        const data = getFilteredReportData('room-wise');

        if (data.length === 0) {
            // V70 FIX: Use alert instead of custom modal
            alert("No data found for the selected filter/session."); 
            return;
        }
        
        // 2. Get the ORIGINAL allocation
        // *** Scribes now have Room: "Room 1", seatNumber: 0, isScribe: true ***
        const processed_rows_with_rooms = performOriginalAllocation(data);

        // 3. Load scribe allotments
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        
        // 4. Create the final list for the report
        const final_student_list_for_report = [];
        
        for (const student of processed_rows_with_rooms) {
            if (student.isScribe) {
                // This is a scribe student. Find their allotted scribe room.
                const sessionKeyPipe = `${student.Date} | ${student.Time}`;
                const sessionScribeAllotment = allScribeAllotments[sessionKeyPipe] || {};
                const scribeRoom = sessionScribeAllotment[student['Register Number']] || 'SCRIBE_ROOM_N/A';
                
                // *** FIX: OVERWRITE 'Room No' to regroup the student ***
                final_student_list_for_report.push({ 
                    ...student, 
                    'Room No': scribeRoom, // <-- OVERWRITE: Use "Room 26" instead of "Room 1"
                    'seatNumber': 0,       // <-- Seat number remains 0 for sorting
                    remark: "Scribe",      // <-- Set remark
                    isPlaceholder: true    // Keep this for styling
                });
            } else {
                // This is a normal student. Add them as-is.
                // Their Room No ("Room 1") and seatNumber (1-28) are correct.
                final_student_list_for_report.push(student);
            }
        }
        // *************************************************

        
        // 5. Store data for CSV (use the "original" allocation data)
        lastGeneratedRoomData = processed_rows_with_rooms; 
        lastGeneratedReportType = "Roomwise_Seating_Report";

        // 6. Group data for Report Generation (use the NEW final list)
        // *** This will now correctly group non-scribes into "Room 1"
        //     and scribes into "Room 26" ***
        const sessions = {};
        loadQPCodes(); 
        final_student_list_for_report.forEach(student => {
            // *** FIX: If a scribe was not allotted, group them into a separate error page ***
            const roomKey = student['Room No']; // This is now "Room 1" or "Room 26"
            const key = `${student.Date}_${student.Time}_${roomKey}`;
            
            if (!sessions[key]) {
                sessions[key] = {
                    Date: student.Date,
                    Time: student.Time,
                    Room: roomKey,
                    students: [],
                    courseCounts: {}
                };
            }
            sessions[key].students.push(student);
            
            // This summary is now correct.
            // Room 1's group only has 28 students.
            // Room 26's group only has 2 students.
            const course = student.Course;
            if (!sessions[key].courseCounts[course]) {
                sessions[key].courseCounts[course] = 0;
            }
            sessions[key].courseCounts[course]++;
        });

        let allPagesHtml = '';
        let totalPagesGenerated = 0;
        
        const sortedSessionKeys = Object.keys(sessions).sort((a, b) => {
            return getNumericSortKey(a).localeCompare(getNumericSortKey(b));
        });

        // 7. Build the HTML report pages
        sortedSessionKeys.forEach(key => {
            const session = sessions[key];
            const studentsPerPage = 20;
            
            // (V28) Get location for this room
            const roomInfo = currentRoomConfig[session.Room];
            const location = (roomInfo && roomInfo.location) ? roomInfo.location : "";
            const locationHtml = location ? `<div class="report-location-header">Location: ${location}</div>` : "";

            // V98: Prepare Course Summary for the FOOTER
            // This is now correct, e.g., Room 1 will show 28 total
            let courseSummaryHtml = '';
            for (const [courseName, count] of Object.entries(session.courseCounts)) {
                courseSummaryHtml += `<div style="font-weight: bold;">${courseName}: ${count} Student(s)</div>`; // V38: Show full course name
            }
            
            // *** COLLEGE NAME IS CORRECTLY REFLECTED HERE ***
            const pageHeaderHtml = `
                <div class="print-header-group">
                    <h1>${currentCollegeName}</h1> <h2>${session.Date} &nbsp;|&nbsp; ${session.Time} &nbsp;|&nbsp; ${session.Room}</h2>
                    ${locationHtml} </div>
            `;
            
            // *** FIX: Changed "Sl No" to "Seat No" and swapped Remarks/Signature ***
            const tableHeaderHtml = `
                <table class="print-table">
                    <thead>
                        <tr>
                            <th class="sl-col">Seat No</th>
                            <th class="course-col">Course (QP Code)</th>
                            <th class="reg-col">Register Number</th>
                            <th class="name-col">Name</th>
                            <th class="remarks-col">Remarks</th>
                            <th class="signature-col">Signature</th>
                        </tr>
                    </thead>
                    <tbody>
            `; 
            
            // *** NEW: Check for scribes on this page to add footnote ***
            const hasScribe = session.students.some(s => s.isPlaceholder);
            const scribeFootnote = hasScribe ? '<div class="scribe-footnote">* = Scribe Assistance</div>' : '';

            const invigilatorFooterHtml = `
                <div class="invigilator-footer">
                    <div class="course-summary-footer">
                        <strong>Course Summary:</strong>
                        ${courseSummaryHtml}
                    </div>
                    <div><strong>Answer Booklets Received:</strong> _________________</div>
                    <div><strong>Answer Booklets Used:</strong> _________________</div>
                    <div><strong>Answer Booklets Returned (Balance):</strong> _________________</div>
                    <div class="signature">
                        Chief Superintendent
                    </div>
                    ${scribeFootnote}
                </div>
            `;

            let previousCourseName = ""; 
            
            // *** THIS IS THE SEAT NUMBERING FIX ***
            // Sort students: Scribes (seatNumber 0) first, then regular students (1, 2, 3...).
            session.students.sort((a, b) => {
                if (a.seatNumber === 0 && b.seatNumber === 0) { // Both are scribes
                    return a['Register Number'].localeCompare(b['Register Number']);
                }
                return a.seatNumber - b.seatNumber; // Sort by seat number
            });

            // NOW, we assign a *new* display seat number
            // For Room 1, this will be (1...28)
            // For Room 26, this will be (1...2)
            session.students.forEach((student, index) => {
                student.displaySeatNumber = index + 1;
            });
            // **************************************************

            function generateTableRows(studentList) {
                let rowsHtml = '';
                studentList.forEach((student) => { 
                    
                    // *** FIX: Use student.displaySeatNumber ***
                    const seatNumber = student.displaySeatNumber;
                    const asterisk = student.isPlaceholder ? '*' : '';
                    
                    // *** NEW: Get QP Code ***
                    const sessionKey = `${student.Date} | ${student.Time}`;
                    const sessionQPCodes = qpCodeMap[sessionKey] || {};
                    const courseKey = cleanCourseKey(student.Course);
                    const qpCode = sessionQPCodes[courseKey] || "";
                    
                    // *** FIX: QP Code first, then course name ***
                    const qpCodePrefix = qpCode ? `(${qpCode}) ` : ""; // e.g., "(QP123) "
                    
                    // Truncate the course name (student.Course)
                    const courseWords = student.Course.split(/\s+/);
                    const truncatedCourse = courseWords.slice(0, 4).join(' ') + (courseWords.length > 4 ? '...' : '');
                    
                    // Combine them
                    const tableCourseName = qpCodePrefix + truncatedCourse;
                    // ************************
                    
                    let displayCourseName = (tableCourseName === previousCourseName) ? '"' : tableCourseName;
                    if (tableCourseName !== previousCourseName) previousCourseName = tableCourseName;

                    // *** FIX: Use class for highlighting ***
                    const rowClass = student.isPlaceholder ? 'class="scribe-row-highlight"' : '';
                    
                    // *** FIX: Added Remarks Column Data, Swapped Remarks/Signature ***
                    const remarkText = student.remark || ''; // Get remark or empty string
                    rowsHtml += `
                        <tr ${rowClass}>
                            <td class="sl-col">${seatNumber}${asterisk}</td>
                            <td class="course-col">${displayCourseName}</td>
                            <td class="reg-col">${student['Register Number']}</td>
                            <td class="name-col">${student.Name}</td>
                            <td class="remarks-col">${remarkText}</td>
                            <td class="signature-col"></td>
                        </tr>
                    `;
                });
                return rowsHtml;
            }
            
            // *** NO SORTING NEEDED HERE, it's done above ***
            const studentsWithIndex = session.students; 
            
            const studentsPage1 = studentsWithIndex.slice(0, 20); // Keep 20 per page for A4 portrait
            const studentsPage2 = studentsWithIndex.slice(20);

            previousCourseName = ""; 
            const tableRowsPage1 = generateTableRows(studentsPage1);
            // V92 FIX: Ensure table is properly closed on every page
            allPagesHtml += `<div class="print-page">${pageHeaderHtml}${tableHeaderHtml}${tableRowsPage1}</tbody></table>`; 
            if (studentsPage2.length === 0) allPagesHtml += invigilatorFooterHtml;
            allPagesHtml += `</div>`; 
            totalPagesGenerated++;
            
            if (studentsPage2.length > 0) {
                previousCourseName = ""; 
                const tableRowsPage2 = generateTableRows(studentsPage2);
                // V92 FIX: Ensure table is properly closed on every page
                allPagesHtml += `<div class="print-page">${tableHeaderHtml}${tableRowsPage2}</tbody></table>${invigilatorFooterHtml}</div>`; 
                totalPagesGenerated++;
            }
        });

        // 8. Show report and controls
        reportOutputArea.innerHTML = allPagesHtml;
        reportOutputArea.style.display = 'block'; 
        reportStatus.textContent = `Generated ${totalPagesGenerated} total pages for ${sortedSessionKeys.length} room sessions.`;
        reportControls.classList.remove('hidden');
        
        // 9. Add download button
        roomCsvDownloadContainer.innerHTML = `
            <button id="download-room-csv-button" class="w-full inline-flex justify-center items-center rounded-md border border-gray-300 bg-white py-3 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                Download Room Allocation Report (.csv)
            </button>
        `;
        document.getElementById('download-room-csv-button').addEventListener('click', downloadRoomCsv);

    } catch (e) {
        console.error("Error generating room-wise report:", e);
        reportStatus.textContent = "An error occurred while generating the report.";
        reportControls.classList.remove('hidden');
    } finally {
        generateReportButton.disabled = false;
        generateReportButton.textContent = "Generate Room-wise Seating Report";
    }
});
// --- (V29) Event listener for the "Day-wise Student List" button ---
generateDaywiseReportButton.addEventListener('click', async () => {
    generateDaywiseReportButton.disabled = true;
    // V49: Button text updated
    generateDaywiseReportButton.textContent = "Generating...";
    reportOutputArea.innerHTML = "";
    reportControls.classList.add('hidden');
    roomCsvDownloadContainer.innerHTML = "";
    lastGeneratedRoomData = []; // This report doesn't use the room CSV
    lastGeneratedReportType = ""; // V91: Reset report type
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        // *** V95 FIX: Refresh college name from local storage BEFORE generation ***
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        
        // 1. Get FILTERED RAW student data
        const data = getFilteredReportData('day-wise');

        if (data.length === 0) {
            alert("No data found for the selected filter/session.");
            return;
        }
        
        // 2. Perform Room Allocation (V29 - uses central function)
        // *** THIS NOW CORRECTLY HANDLES SCRIBES (seatNumber: 0) ***
        const processed_rows_with_rooms = performOriginalAllocation(data); // <-- Uses corrected allocation

        // 3. Group by Day/Session
        const daySessions = {};
        processed_rows_with_rooms.forEach(student => {
            const key = `${student.Date}_${student.Time}`;
            if (!daySessions[key]) {
                daySessions[key] = {
                    Date: student.Date,
                    Time: student.Time,
                    students: []
                };
            }
            daySessions[key].students.push(student);
        });

        // *** NEW: Get scribe allotments ***
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        
        // 7. Build the HTML
        let allPagesHtml = '';
        let totalPagesGenerated = 0;
        // *** FIX: Changed to 35 rows per column for A4 fit ***
        const STUDENTS_PER_COLUMN = 35; 
        const COLUMNS_PER_PAGE = 2; 
        const STUDENTS_PER_PAGE = STUDENTS_PER_COLUMN * COLUMNS_PER_PAGE; 

        // (V30) Helper to build a table for a column, NOW WITH COURSE GROUPING
        function buildColumnTable(studentChunk) {
            let rowsHtml = '';
            let currentCourse = ""; // Track the current course
            let previousRoomDisplay = ""; // V48: Track previous room

            studentChunk.forEach(student => {
                // Check if the course has changed
                if (student.Course !== currentCourse) {
                    currentCourse = student.Course;
                    previousRoomDisplay = ""; // V48: Reset for new course
                    // Add a course heading row
                    rowsHtml += `
                        <tr>
                            <td colspan="4" style="background-color: #ddd; font-weight: bold; padding: 4px 2px; border: 1px solid #999;">
                                ${student.Course}
                            </td>
                        </tr>
                    `;
                }

                // *** FIX: Get correct room and seat no for scribes ***
                let roomName = student['Room No'];
                let seatNo = student.seatNumber; // Use the original seat number (0 for scribes)
                let rowStyle = '';

                if (student.isScribe) {
                    const sessionKeyPipe = `${student.Date} | ${student.Time}`;
                    const sessionScribeAllotment = allScribeAllotments[sessionKeyPipe] || {};
                    roomName = sessionScribeAllotment[student['Register Number']] || 'N/A'; // Get new scribe room
                    seatNo = 'Scribe'; // Scribes don't have a seat number in the new room
                    rowStyle = 'font-weight: bold; color: #c2410c;'; // Style for scribe
                }
                // *****************************************************

                // Add the student row
                const roomInfo = currentRoomConfig[roomName];
                const location = (roomInfo && roomInfo.location) ? roomInfo.location : "";
                const roomDisplay = location ? `${roomName} (${location})` : roomName;

                // V48: Check if same as above
                const displayRoom = (roomDisplay === previousRoomDisplay) ? '"' : roomDisplay;
                previousRoomDisplay = roomDisplay; // Update for next iteration
                
                rowsHtml += `
                    <tr style="${rowStyle}">
                        <td>${student['Register Number']}</td>
                        <td>${student.Name}</td>
                        <td>${displayRoom}</td>
                        <td style="text-align: center;">${seatNo}</td>
                    </tr>
                `;
            });

            // (V30) Updated table header to remove Course
            // (V32) Updated widths
            // *** FIX: Changed Sl to Seat No ***
            return `
                <table class="daywise-report-table">
                    <thead>
                        <tr>
                            <th style="width: 25%;">Register No</th>
                            <th style="width: 35%;">Name</th>
                            <th style="width: 30%;">Room (Location)</th>
                            <th style="width: 10%;">Seat No</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            `;
        }

        const sortedSessionKeys = Object.keys(daySessions).sort();

        sortedSessionKeys.forEach(key => {
            const session = daySessions[key];
            
            // *** FIX: Sort students by Course, then Reg No for this report ***
            session.students.sort((a, b) => {
                if (a.Course !== b.Course) return a.Course.localeCompare(b.Course);
                return a['Register Number'].localeCompare(b['Register Number']);
            });
            
            for (let i = 0; i < session.students.length; i += STUDENTS_PER_PAGE) {
                const pageStudents = session.students.slice(i, i + STUDENTS_PER_PAGE);
                totalPagesGenerated++;
                
                const col1Students = pageStudents.slice(0, STUDENTS_PER_COLUMN);
                const col2Students = pageStudents.slice(STUDENTS_PER_COLUMN); 
                
                let columnHtml = '';
                if (col1Students.length > 0 && col2Students.length === 0) {
                    // Only column 1 needed
                    columnHtml = `<div class="column">${buildColumnTable(col1Students)}</div>`;
                } else if (col1Students.length > 0 && col2Students.length > 0) {
                    // Two columns needed
                    columnHtml = `
                        <div class="column-container">
                            <div class="column">
                                ${buildColumnTable(col1Students)}
                            </div>
                            <div class="column">
                                ${buildColumnTable(col2Students)}
                            </div>
                        </div>
                    `;
                }
                
                // *** NEW: Scribe summary logic ***
                let scribeListHtml = '';
                // Check if this is the last page for the session
                if (i + STUDENTS_PER_PAGE >= session.students.length) {
                    const sessionScribes = session.students.filter(s => s.isScribe);
                    if (sessionScribes.length > 0) {
                        scribeListHtml = '<div class="scribe-summary-box" style="margin-top: 2rem; padding: 1rem; border: 2px solid #f97316; background: #fffbeb; border-radius: 8px;">';
                        scribeListHtml += '<h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 0.5rem; color: #c2410c;">Scribe Assistance Summary</h3>';
                        
                        sessionScribes.forEach(scribe => {
                            const sessionKeyPipe = `${scribe.Date} | ${scribe.Time}`;
                            const sessionScribeAllotment = allScribeAllotments[sessionKeyPipe] || {};
                            const newRoom = sessionScribeAllotment[scribe['Register Number']] || 'N/A';
                            
                            // *** FIX: Updated text to reflect "Virtual Slot" ***
                            scribeListHtml += `<p style="font-size: 9pt; margin-bottom: 4px;"><strong>${scribe.Name}</strong> (${scribe['Register Number']})<br>Original: ${scribe['Room No']} (Virtual Slot) &rarr; <strong>New Room: ${newRoom}</strong></p>`;
                        });
                        scribeListHtml += '</div>';
                    }
                }
                // ******************************

                allPagesHtml += `
                    <div class="print-page print-page-daywise">
                        <div class="print-header-group">
                            <h1>Seating Details for Candidates</h1>
                            <h2>${currentCollegeName} &nbsp;|&nbsp; ${session.Date} &nbsp;|&nbsp; ${session.Time}</h2>
                        </div>
                        ${columnHtml}
                        ${scribeListHtml} 
                    </div>
                `;
            }
        });

        // 8. Show report and controls
        reportOutputArea.innerHTML = allPagesHtml;
        reportOutputArea.style.display = 'block'; 
        reportStatus.textContent = `Generated ${totalPagesGenerated} compact pages for ${sortedSessionKeys.length} sessions.`;
        reportControls.classList.remove('hidden');
        roomCsvDownloadContainer.innerHTML = ""; // This report has no CSV
        lastGeneratedReportType = "Daywise_Seating_Details"; // V91: Set report type

    } catch (e) {
        console.error("Error generating day-wise report:", e);
        reportStatus.textContent = "An error occurred while generating the report.";
        reportControls.classList.remove('hidden');
    } finally {
        generateDaywiseReportButton.disabled = false;
        // V49: Button text updated
        generateDaywiseReportButton.textContent = "Generate Seating Details for Candidates (Compact)";
    }
});
// --- V91: Event listener for "Generate Question Paper Report" (Added report type set) ---
generateQPaperReportButton.addEventListener('click', async () => {
    generateQPaperReportButton.disabled = true;
    generateQPaperReportButton.textContent = "Generating...";
    reportOutputArea.innerHTML = "";
    reportControls.classList.add('hidden');
    roomCsvDownloadContainer.innerHTML = "";
    lastGeneratedReportType = ""; // V91: Reset report type
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
        // *** V95 FIX: Refresh college name from local storage BEFORE generation ***
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        
        // V68: Get Filtered data
        const filteredData = getFilteredReportData('q-paper');
        
        // Group the filtered data to generate the Q-Paper summary dynamically
        const qPaperSummary = {};
        filteredData.forEach(item => {
            const key = `${item.Date}_${item.Time}`;
            if (!qPaperSummary[key]) {
                qPaperSummary[key] = { Date: item.Date, Time: item.Time, courses: {} };
            }
            const courseKey = item.Course;
            if (!qPaperSummary[key].courses[courseKey]) {
                qPaperSummary[key].courses[courseKey] = 0;
            }
            qPaperSummary[key].courses[courseKey]++;
        });

        const sessions = qPaperSummary;
        
        if (Object.keys(sessions).length === 0) {
            alert("No question paper data found for the selected filter/session.");
            return;
        }
        
        let allPagesHtml = '';
        let totalPages = 0;
        const sortedSessionKeys = Object.keys(sessions).sort((a, b) => a.localeCompare(b));
        
        sortedSessionKeys.forEach(key => {
            const session = sessions[key];
            totalPages++;
            let totalStudentsInSession = 0;
            
            let tableRowsHtml = '';
            const sortedCourses = Object.keys(session.courses).sort();

            sortedCourses.forEach((courseName, index) => {
                const count = session.courses[courseName];
                totalStudentsInSession += count;
                tableRowsHtml += `
                    <tr>
                        <td class="sl-col">${index + 1}</td>
                        <td class="course-col">${courseName}</td>
                        <td class="count-col">${count}</td>
                    </tr>
                `;
            });
            
            const pageHtml = `
                <div class="print-page">
                    <div class="print-header-group">
                        <h1>${currentCollegeName}</h1> <h2>Question Paper Summary</h2>
                        <h3>${session.Date} &nbsp;|&nbsp; ${session.Time}</h3>
                    </div>
                    
                    <table class="q-paper-table print-table">
                        <thead>
                            <tr>
                                <th class="sl-col">Sl No</th>
                                <th class="course-col">Course Name</th>
                                <th class="count-col">Student Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="text-align: right;"><strong>Total Students</strong></td>
                                <td class="count-col"><strong>${totalStudentsInSession}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
            allPagesHtml += pageHtml;
        });
        
        reportOutputArea.innerHTML = allPagesHtml;
        reportOutputArea.style.display = 'block'; 
        reportStatus.textContent = `Generated ${totalPages} summary pages for ${sortedSessionKeys.length} sessions.`;
        reportControls.classList.remove('hidden');
        lastGeneratedReportType = "Question_Paper_Summary"; // V91: Set report type

    } catch(e) {
        console.error("Error generating Q-Paper report:", e);
        reportStatus.textContent = "An error occurred generating the report.";
        reportControls.classList.remove('hidden');
    } finally {
        generateQPaperReportButton.disabled = false;
        generateQPaperReportButton.textContent = "Generate Question Paper Report";
    }
});
        
// *** NEW: Helper for Absentee Report ***
function formatRegNoList(regNos) {
    if (!regNos || regNos.length === 0) return '<em>None</em>';
    
    let lastPrefix = "";
    const outputHtml = [];
    // Regex to split letters from numbers (e.g., "VPAYSBO" and "007")
    const regEx = /^([A-Z]+)(\d+)$/; 

    regNos.sort(); 
    
    regNos.forEach((regNo, index) => {
        const match = regNo.match(regEx);
        if (match) {
            const prefix = match[1];
            const number = match[2];
            
            if (prefix === lastPrefix) {
                // Same prefix, only show number with a comma
                outputHtml.push(`<span>, ${number}</span>`);
            } else {
                // New prefix, show full register number
                lastPrefix = prefix;
                // Add a line break if this isn't the very first item
                if(outputHtml.length > 0) {
                     outputHtml.push('<br>');
                }
                outputHtml.push(`<span>${regNo}</span>`);
            }
        } else {
            // Fallback for non-matching register numbers (e.g., old numbers)
            if(outputHtml.length > 0) {
                 outputHtml.push('<br>');
            }
            outputHtml.push(`<span>${regNo}</span>`);
            lastPrefix = ""; // Reset prefix
        }
    });
    
    return outputHtml.join('');
}
        
// --- (V56) Event listener for "Generate Absentee Statement" ---
generateAbsenteeReportButton.addEventListener('click', async () => {
    const sessionKey = sessionSelect.value;
    if (!sessionKey) {
        alert("Please select a session first.");
        return;
    }

    generateAbsenteeReportButton.disabled = true;
    generateAbsenteeReportButton.textContent = "Generating...";
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
        // *** V95 FIX: Refresh college name from local storage BEFORE generation ***
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        
        // 1. Get all students for this session
        const [date, time] = sessionKey.split(' | ');
        const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
        
        // 2. Get absentee register numbers for this session
        const allAbsentees = JSON.parse(localStorage.getItem(ABSENTEE_LIST_KEY) || '{}');
        const absenteeRegNos = new Set(allAbsentees[sessionKey] || []);
        
        // 3. Group students by Course
        const courses = {};
        for (const student of sessionStudents) {
            const courseDisplay = student.Course;
            const courseKey = cleanCourseKey(courseDisplay); // V64 FIX: Ensure course key is aggressively cleaned
            
            if (!courses[courseKey]) {
                courses[courseKey] = {
                    name: courseDisplay,
                    present: [],
                    absent: []
                };
            }
            
            if (absenteeRegNos.has(student['Register Number'])) {
                courses[courseKey].absent.push(student['Register Number']);
            } else {
                courses[courseKey].present.push(student['Register Number']);
            }
        }
        
        // 4. Build Report Pages
        let allPagesHtml = '';
        let totalPages = 0;
        const sortedCourseKeys = Object.keys(courses).sort();
        
        // V58: Load QP codes
        loadQPCodes(); // Ensure qpCodeMap is up-to-date
        
        for (const courseKey of sortedCourseKeys) {
            totalPages++;
            const courseData = courses[courseKey];
            // V64 FIX: Use the clean key for lookup
            // V89: Load session-specific codes
            const sessionCodes = qpCodeMap[sessionKey] || {};
            const qpCode = sessionCodes[courseKey] || "____"; 
            
            // *** NEW: Use formatting function ***
            const presentListHtml = formatRegNoList(courseData.present);
            const absentListHtml = formatRegNoList(courseData.absent);
            
            // V57: Add page break logic. Each course is a new page.
            allPagesHtml += `
                <div class="print-page">
                    <div class="print-header-group">
                        <h1>${currentCollegeName}</h1>
                        <h2>Absentee Statement</h2>
                        <h3>${date} &nbsp;|&nbsp; ${time}</h3>
                    </div>
                
                    <table class="absentee-report-table">
                        <thead>
                            <tr>
                                <th colspan="2">Course: ${courseData.name} &nbsp;&nbsp; [ QP Code: ${qpCode} ]</th>
                            </tr>
                            <tr>
                                <th>Status</th>
                                <th>Register Numbers</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Present (${courseData.present.length})</strong></td>
                                <td class="regno-list">
                                    ${presentListHtml}
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Absent (${courseData.absent.length})</strong></td>
                                <td class="regno-list">
                                    ${absentListHtml}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="absentee-footer">
                        <div class="signature">
                            Chief Superintendent
                        </div>
                    </div>
                </div>
            `;
        }

        // 5. Show report and controls
        reportOutputArea.innerHTML = allPagesHtml;
        reportOutputArea.style.display = 'block'; 
        reportStatus.textContent = `Generated ${totalPages} page(s) for ${sortedCourseKeys.length} courses.`;
        reportControls.classList.remove('hidden');
        roomCsvDownloadContainer.innerHTML = ""; // This report has no CSV
        lastGeneratedReportType = `Absentee_Statement_${date.replace(/\./g, '_')}_${time.replace(/\s/g, '')}`; // V91: Set report type

    } catch (e) {
        console.error("Error generating absentee report:", e);
        reportStatus.textContent = "An error occurred while generating the report.";
        reportControls.classList.remove('hidden');
    } finally {
        generateAbsenteeReportButton.disabled = false;
        generateAbsenteeReportButton.textContent = "Generate Absentee Statement";
    }
});
        
// *** NEW: Event listener for "Generate Scribe Report" ***
generateScribeReportButton.addEventListener('click', async () => {
    generateScribeReportButton.disabled = true;
    generateScribeReportButton.textContent = "Generating...";
    reportOutputArea.innerHTML = "";
    reportControls.classList.add('hidden');
    roomCsvDownloadContainer.innerHTML = "";
    lastGeneratedReportType = "";
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        
        // 1. Get all data
        const allData = JSON.parse(jsonDataStore.innerHTML || '[]');
        if (allData.length === 0) {
            alert("No data loaded.");
            return;
        }
        
        // 2. Get global scribe list
        loadGlobalScribeList();
        if (globalScribeList.length === 0) {
            alert("No students have been added to the Scribe List in Scribe Assistance.");
            return;
        }
        const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));
        
        // 3. Get all scribe students from the main data
        const allScribeStudents = allData.filter(s => scribeRegNos.has(s['Register Number']));
        
        // 4. Get Original Room Allotments (by running the "original" allocation logic)
        const originalAllotments = performOriginalAllocation(allData); // Use the central function
        const originalRoomMap = originalAllotments.reduce((map, s) => {
            // *** This will correctly map scribes to their "virtual" room ***
            map[s['Register Number']] = s['Room No'];
            return map;
        }, {});

        // 5. Load Scribe Allotments and QP Codes
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        loadQPCodes(); // populates qpCodeMap

        // 6. Collate all data for the report
        const reportRows = [];
        for (const s of allScribeStudents) {
            const sessionKey = `${s.Date} | ${s.Time}`;
            const sessionScribeRooms = allScribeAllotments[sessionKey] || {};
            const sessionQPCodes = qpCodeMap[sessionKey] || {};
            const courseKey = cleanCourseKey(s.Course);
            
            reportRows.push({
                Date: s.Date,
                Time: s.Time,
                RegisterNumber: s['Register Number'],
                Name: s.Name,
                Course: s.Course,
                OriginalRoom: originalRoomMap[s['Register Number']] || 'N/A',
                ScribeRoom: sessionScribeRooms[s['Register Number']] || 'Not Allotted',
                QPCode: sessionQPCodes[courseKey] || 'N/A'
            });
        }
        
        // 7. Group by Session
        const sessions = {};
        for (const row of reportRows) {
            const key = `${row.Date}_${row.Time}`;
            if (!sessions[key]) {
                sessions[key] = {
                    Date: row.Date,
                    Time: row.Time,
                    students: []
                };
            }
            sessions[key].students.push(row);
        }

        // 8. Build HTML
        let allPagesHtml = '';
        let totalPages = 0;
        const sortedSessionKeys = Object.keys(sessions).sort();

        if (sortedSessionKeys.length === 0) {
            alert("No scribe students found for any session with loaded data.");
            return;
        }

        sortedSessionKeys.forEach(key => {
            const session = sessions[key];
            totalPages++;
            
            let tableRowsHtml = '';
            session.students.forEach((student, index) => {
                tableRowsHtml += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${student.RegisterNumber}</td>
                        <td>${student.Name}</td>
                        <td>${student.Course}</td>
                        <td>${student.QPCode}</td>
                        <td>${student.OriginalRoom}</td>
                        <td>${student.ScribeRoom}</td>
                    </tr>
                `;
            });
            
            allPagesHtml += `
                <div class="print-page">
                    <div class="print-header-group">
                        <h1>${currentCollegeName}</h1>
                        <h2>Scribe Assistance Report</h2>
                        <h3>${session.Date} &nbsp;|&nbsp; ${session.Time}</h3>
                    </div>
                    
                    <table class="scribe-report-table">
                        <thead>
                            <tr>
                                <th style="width: 5%;">Sl</th>
                                <th style="width: 15%;">Register No</th>
                                <th style="width: 20%;">Name</th>
                                <th style="width: 25%;">Course / Paper</th>
                                <th style="width: 10%;">QP Code</th>
                                <th style="width: 10%;">Original Room</th>
                                <th style="width: 15%;">Scribe Room</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                        </tbody>
                    </table>
                </div>
            `;
        });
        
        // 9. Show report
        reportOutputArea.innerHTML = allPagesHtml;
        reportOutputArea.style.display = 'block'; 
        reportStatus.textContent = `Generated ${totalPages} scribe report pages for ${sortedSessionKeys.length} sessions.`;
        reportControls.classList.remove('hidden');
        lastGeneratedReportType = "Scribe_Assistance_Report";

    } catch (e) {
        console.error("Error generating scribe report:", e);
        reportStatus.textContent = "An error occurred generating the report.";
        reportControls.classList.remove('hidden');
    } finally {
        generateScribeReportButton.disabled = false;
        generateScribeReportButton.textContent = "Generate Scribe Assistance Report";
    }
});
// *******************************************************


// --- V96: Removed PDF Download Functionality (Replaced with native Print) ---
// downloadPdfButton.addEventListener('click', ... removed ...)

// --- Event listener for the "Print" button ---
finalPrintButton.addEventListener('click', () => {
    // This button now exclusively uses the native browser print function
    window.print();
});

// --- Event listener for the "Clear" button ---
clearReportButton.addEventListener('click', clearReport);

// --- Centralized logic for clearing reports ---
function clearReport() {
    reportOutputArea.innerHTML = "";
    reportOutputArea.style.display = 'none'; 
    reportControls.classList.add('hidden');
    roomCsvDownloadContainer.innerHTML = ""; // Clear CSV button
    lastGeneratedRoomData = []; // Clear data
    lastGeneratedReportType = ""; // V91: Clear report type
}

// --- Function to download the room-allocated CSV ---
function downloadRoomCsv() {
    if (!lastGeneratedRoomData || lastGeneratedRoomData.length === 0) {
        alert("No room data to download.");
        return;
    }
    
    // (V28) Add Location to CSV
    const headers = ['Date', 'Time', 'Course', 'Register Number', 'Name', 'Room No', 'Location'];
    let csvContent = headers.join(",") + "\n";
    
    lastGeneratedRoomData.forEach(row => {
        // (V28) Get location for this row
        const roomInfo = currentRoomConfig[row['Room No']];
        const location = (roomInfo && roomInfo.location) ? row['Location'] || roomInfo.location.toString() : ""; // V91 FIX: Use row location if present
        
        const values = headers.map(header => {
            let val = row[header] ? row[header].toString() : "";
            if (header === 'Location') { val = location; } // V91 FIX: Explicitly set location
            
            val = val.replace(/"/g, '""');
            if (val.includes(',') || val.includes('\n')) {
                val = `"${val}"`;
            }
            return val;
        });
        csvContent += values.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Room_Allocation_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
