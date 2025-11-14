// Import all the initialization functions from other modules
import { loadInitialData } from './dataLoader.js';
import { initNavigation } from './navigation.js';
import { initReports } from './reports.js';
import { initSettingsTab } from './tab-settings.js';
import { initScribeSettingsTab } from './tab-scribeSettings.js';
import { initRoomAllotmentTab } from './tab-roomAllotment.js';
import { initQPCodesTab } from './tab-qpcode.js';
import { initSearchTab } from './tab-search.js';
import { initAbsenteeTab } from './tab-absentee.js';

// Import the bridge to attach functions to the window
import './pythonBridge.js';

// When the page is loaded, initialize all the modules
document.addEventListener('DOMContentLoaded', () => {
    // Load data first, as other modules depend on it
    loadInitialData();

    // Initialize all the different parts of the app
    initNavigation();
    initReports();
    initSettingsTab();
    initScribeSettingsTab();
    initRoomAllotmentTab();
    initQPCodesTab();
    initSearchTab();
    initAbsenteeTab();
});
