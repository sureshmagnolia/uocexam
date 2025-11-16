// --- Global localStorage Key ---
const ROOM_CONFIG_KEY = 'examRoomConfig';
const COLLEGE_NAME_KEY = 'examCollegeName';
const ABSENTEE_LIST_KEY = 'examAbsenteeList';
const QP_CODE_LIST_KEY = 'examQPCodes';
const BASE_DATA_KEY = 'examBaseData';
const ROOM_ALLOTMENT_KEY = 'examRoomAllotment';
const SCRIBE_LIST_KEY = 'examScribeList';
const SCRIBE_ALLOTMENT_KEY = 'examScribeAllotment';

// All keys for backup/restore
const ALL_DATA_KEYS = [
    ROOM_CONFIG_KEY,
    COLLEGE_NAME_KEY,
    ABSENTEE_LIST_KEY,
    QP_CODE_LIST_KEY,
    BASE_DATA_KEY,
    ROOM_ALLOTMENT_KEY,
    SCRIBE_LIST_KEY,
    SCRIBE_ALLOTMENT_KEY
];

// Global variables
let lastGeneratedRoomData = [];
let lastGeneratedReportType = "";
let currentRoomConfig = {};
let currentCollegeName = "University of Calicut";
let allStudentData = [];
let allStudentSessions = [];
let currentAbsenteeList = [];
let selectedStudent = null;
let qpCodeMap = {};
let currentSessionAllotment = [];
let currentSessionKey = '';
let globalScribeList = [];
let currentScribeAllotment = {};
let studentToAllotScribeRoom = null;
let allUniqueStudentsForScribeSearch = [];

// Get references to elements
const generateReportButton = document.getElementById('generate-report-button');
const jsonDataStore = document.getElementById('json-data-store');
const reportControls = document.getElementById('report-controls-top'); // Fixed ID
const reportOutputArea = document.getElementById('report-output-area');
const reportStatus = document.getElementById('report-status');
const finalPrintButton = document.getElementById('final-print-button');
const clearReportButton = document.getElementById('clear-report-button');
const roomCsvDownloadContainer = document.getElementById('room-csv-download-container');

// Navigation elements
const viewExtractor = document.getElementById('view-extractor');
const viewSettings = document.getElementById('view-settings');
const viewQPCodes = document.getElementById('view-qpcodes');
const viewReports = document.getElementById('view-reports');
const viewAbsentees = document.getElementById('view-absentees');
const navExtractor = document.getElementById('nav-extractor');
const navEditData = document.getElementById('nav-edit-data');
const navSettings = document.getElementById('nav-settings');
const navQPCodes = document.getElementById('nav-qpcodes');
const navReports = document.getElementById('nav-reports');
const navAbsentees = document.getElementById('nav-absentees');
const navScribeSettings = document.getElementById('nav-scribe-settings');
const navRoomAllotment = document.getElementById('nav-room-allotment');
const viewRoomAllotment = document.getElementById('view-room-allotment');
const viewScribeSettings = document.getElementById('view-scribe-settings');
const navSearch = document.getElementById('nav-search');
const viewSearch = document.getElementById('view-search');

// Search elements
const searchSessionSelect = document.getElementById('search-session-select');
const studentSearchSection = document.getElementById('student-search-section');
const studentSearchInput = document.getElementById('student-search-input');
const studentSearchAutocomplete = document.getElementById('student-search-autocomplete');
const studentSearchStatus = document.getElementById('student-search-status');

// Fix: Implement missing utility functions
window.js = window.js || {};

// Clear CSV upload status
window.js.clear_csv_upload_status = function() {
    const csvLoadStatus = document.getElementById('csv-load-status');
    if (csvLoadStatus) {
        csvLoadStatus.textContent = '';
    }
};

// Disable/Enable absentee tab
window.js.disable_absentee_tab = function(disable) {
    const absenteeLoader = document.getElementById('absentee-loader');
    const absenteeContentWrapper = document.getElementById('absentee-content-wrapper');
    
    if (absenteeLoader && absenteeContentWrapper) {
        if (disable) {
            absenteeLoader.style.display = 'block';
            absenteeContentWrapper.style.display = 'none';
        } else {
            absenteeLoader.style.display = 'none';
            absenteeContentWrapper.style.display = 'block';
        }
    }
};

// Disable/Enable QP Code tab
window.js.disable_qpcode_tab = function(disable) {
    const qpcodeLoader = document.getElementById('qpcode-loader');
    const qpcodeContentWrapper = document.getElementById('qpcode-content-wrapper');
    
    if (qpcodeLoader && qpcodeContentWrapper) {
        if (disable) {
            qpcodeLoader.style.display = 'block';
            qpcodeContentWrapper.style.display = 'none';
        } else {
            qpcodeLoader.style.display = 'none';
            qpcodeContentWrapper.style.display = 'block';
        }
    }
};

// Disable/Enable room allotment tab
window.js.disable_room_allotment_tab = function(disable) {
    const roomAllotmentLoader = document.getElementById('room-allotment-loader');
    const roomAllotmentContentWrapper = document.getElementById('room-allotment-content-wrapper');
    
    if (roomAllotmentLoader && roomAllotmentContentWrapper) {
        if (disable) {
            roomAllotmentLoader.style.display = 'block';
            roomAllotmentContentWrapper.style.display = 'none';
        } else {
            roomAllotmentLoader.style.display = 'none';
            roomAllotmentContentWrapper.style.display = 'block';
        }
    }
};

// Populate session dropdowns
window.js.populate_session_dropdown = function() {
    try {
        const baseData = localStorage.getItem(BASE_DATA_KEY);
        if (!baseData) return;
        
        const data = JSON.parse(baseData);
        const sessions = [...new Set(data.map(row => `${row.Date} | ${row.Time}`))].sort();
        
        // Populate absentee session select
        const sessionSelect = document.getElementById('session-select');
        if (sessionSelect) {
            sessionSelect.innerHTML = '<option value="">-- Select a Session --</option>';
            sessions.forEach(session => {
                const option = document.createElement('option');
                option.value = session;
                option.textContent = session;
                sessionSelect.appendChild(option);
            });
        }
        
        // Populate search session select
        const searchSessionSelect = document.getElementById('search-session-select');
        if (searchSessionSelect) {
            searchSessionSelect.innerHTML = '<option value="">-- Select a Session --</option>';
            sessions.forEach(session => {
                const option = document.createElement('option');
                option.value = session;
                option.textContent = session;
                searchSessionSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error populating session dropdowns:', error);
    }
};

// Populate QP Code session dropdown
window.js.populate_qp_code_session_dropdown = function() {
    try {
        const baseData = localStorage.getItem(BASE_DATA_KEY);
        if (!baseData) return;
        
        const data = JSON.parse(baseData);
        const sessions = [...new Set(data.map(row => `${row.Date} | ${row.Time}`))].sort();
        
        const sessionSelectQP = document.getElementById('session-select-qp');
        if (sessionSelectQP) {
            sessionSelectQP.innerHTML = '<option value="">-- Select a Session --</option>';
            sessions.forEach(session => {
                const option = document.createElement('option');
                option.value = session;
                option.textContent = session;
                sessionSelectQP.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error populating QP code session dropdown:', error);
    }
};

// Populate room allotment session dropdown
window.js.populate_room_allotment_session_dropdown = function() {
    try {
        const baseData = localStorage.getItem(BASE_DATA_KEY);
        if (!baseData) return;
        
        const data = JSON.parse(baseData);
        const sessions = [...new Set(data.map(row => `${row.Date} | ${row.Time}`))].sort();
        
        const allotmentSessionSelect = document.getElementById('allotment-session-select');
        if (allotmentSessionSelect) {
            allotmentSessionSelect.innerHTML = '<option value="">-- Select a Session --</option>';
            sessions.forEach(session => {
                const option = document.createElement('option');
                option.value = session;
                option.textContent = session;
                allotmentSessionSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error populating room allotment session dropdown:', error);
    }
};

// Navigation functionality
const allNavButtons = [navExtractor, navEditData, navScribeSettings, navRoomAllotment, navQPCodes, navSearch, navReports, navAbsentees, navSettings];
const allViews = [viewExtractor, viewEditData, viewScribeSettings, viewRoomAllotment, viewQPCodes, viewSearch, viewReports, viewAbsentees, viewSettings];

function switchView(activeView) {
    // Hide all views
    allViews.forEach(view => {
        if (view) view.classList.add('hidden');
    });
    
    // Deactivate all nav buttons
    allNavButtons.forEach(button => {
        if (button) {
            button.classList.remove('nav-button-active');
            button.classList.add('nav-button-inactive');
        }
    });
    
    // Show active view and activate button
    if (activeView) {
        activeView.classList.remove('hidden');
        
        // Find and activate corresponding nav button
        const navMap = {
            'view-extractor': navExtractor,
            'view-edit-data': navEditData,
            'view-scribe-settings': navScribeSettings,
            'view-room-allotment': navRoomAllotment,
            'view-qpcodes': navQPCodes,
            'view-search': navSearch,
            'view-reports': navReports,
            'view-absentees': navAbsentees,
            'view-settings': navSettings
        };
        
        const activeNav = navMap[activeView.id];
        if (activeNav) {
            activeNav.classList.remove('nav-button-inactive');
            activeNav.classList.add('nav-button-active');
        }
    }
}

// Navigation event listeners
if (navExtractor) {
    navExtractor.addEventListener('click', () => switchView(viewExtractor));
}

if (navEditData) {
    navEditData.addEventListener('click', () => switchView(viewEditData));
}

if (navScribeSettings) {
    navScribeSettings.addEventListener('click', () => switchView(viewScribeSettings));
}

if (navRoomAllotment) {
    navRoomAllotment.addEventListener('click', () => switchView(viewRoomAllotment));
}

if (navQPCodes) {
    navQPCodes.addEventListener('click', () => switchView(viewQPCodes));
}

if (navSearch) {
    navSearch.addEventListener('click', () => switchView(viewSearch));
}

if (navReports) {
    navReports.addEventListener('click', () => switchView(viewReports));
}

if (navAbsentees) {
    navAbsentees.addEventListener('click', () => switchView(viewAbsentees));
}

if (navSettings) {
    navSettings.addEventListener('click', () => switchView(viewSettings));
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Set initial view
    if (viewExtractor) {
        switchView(viewExtractor);
    }
    
    // Load saved data if available
    try {
        const savedData = localStorage.getItem(BASE_DATA_KEY);
        if (savedData) {
            // Enable tabs that depend on data
            window.js.disable_absentee_tab(false);
            window.js.disable_qpcode_tab(false);
            window.js.disable_room_allotment_tab(false);
            
            // Populate dropdowns
            window.js.populate_session_dropdown();
            window.js.populate_qp_code_session_dropdown();
            window.js.populate_room_allotment_session_dropdown();
        }
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});

// Error handling for uncaught errors
window.addEventListener('error', function(event) {
    console.error('Uncaught error:', event.error);
    // You could add user-friendly error reporting here
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
    // You could add user-friendly error reporting here
});

// Export functions for use in other scripts
window.ExamFlow = {
    switchView,
    getRoomCapacitiesFromStorage: function() {
        // This function should be implemented based on the original code
        return { roomNames: [], roomCapacities: [] };
    },
    performOriginalAllocation: function(data) {
        // This function should be implemented based on the original code
        return data;
    }
};