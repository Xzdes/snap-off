import { randomBytes } from 'crypto';
const SESSION_STORAGE_KEY = '_snap_states';

function generateInstanceId() { return randomBytes(6).toString('base64url'); }
function ensureStateStorage(session) { if (!session[SESSION_STORAGE_KEY]) { session[SESSION_STORAGE_KEY] = {}; } }

export function createAndSaveState(session, componentDefinition, props) {
    ensureStateStorage(session);
    const instanceId = generateInstanceId();
    const initialState = componentDefinition.handler.createState(props);
    session[SESSION_STORAGE_KEY][instanceId] = {
        componentName: componentDefinition.name,
        state: initialState,
    };
    console.log(`[state] CREATED: New instance '${instanceId}' for component '${componentDefinition.name}'. Initial state:`, initialState);
    return { instanceId, initialState };
}

export function getState(session, instanceId) {
    ensureStateStorage(session);
    const data = session[SESSION_STORAGE_KEY][instanceId] || null;
    if (data) {
        console.log(`[state] READ: State for '${instanceId}'. Found:`, data.state);
    } else {
        console.warn(`[state] READ FAILED: No state found for '${instanceId}'.`);
    }
    return data;
}

export function updateState(session, instanceId, newState) {
    ensureStateStorage(session);
    const instanceData = session[SESSION_STORAGE_KEY][instanceId];
    if (instanceData) {
        instanceData.state = newState;
        console.log(`[state] UPDATED: State for '${instanceId}'. New state:`, newState);
    }
}