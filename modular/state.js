// --- Global localStorage Key ---
export const ROOM_CONFIG_KEY = 'examRoomConfig';
export const COLLEGE_NAME_KEY = 'examCollegeName';
export const ABSENTEE_LIST_KEY = 'examAbsenteeList';
export const QP_CODE_LIST_KEY = 'examQPCodes';
export const BASE_DATA_KEY = 'examBaseData';
export const ROOM_ALLOTMENT_KEY = 'examRoomAllotment';
export const SCRIBE_LIST_KEY = 'examScribeList';
export const SCRIBE_ALLOTMENT_KEY = 'examScribeAllotment';

// --- Application State ---
export let allStudentData = [];
export let allStudentSessions = [];
export let allUniqueStudentsForScribeSearch = [];
export let currentRoomConfig = {};
export let currentCollegeName = "University of Calicut";
export let qpCodeMap = {};
export let globalScribeList = [];
export let lastGeneratedRoomData = [];
export let lastGeneratedReportType = "";

// --- State-Modifying Functions ---

export function setAllStudentData(data) {
    allStudentData = data;
}
export function setAllStudentSessions(sessions) {
    allStudentSessions = sessions;
}
export function setAllUniqueStudents(students) {
    allUniqueStudentsForScribeSearch = students;
}
export function setCurrentRoomConfig(config) {
    currentRoomConfig = config;
}
export function setCurrentCollegeName(name) {
    currentCollegeName = name;
}
export function setQpCodeMap(map) {
    qpCodeMap = map;
}
export function setGlobalScribeList(list) {
    globalScribeList = list;
}
export function setLastGeneratedRoomData(data) {
    lastGeneratedRoomData = data;
}
export function setLastGeneratedReportType(type) {
    lastGeneratedReportType = type;
}
