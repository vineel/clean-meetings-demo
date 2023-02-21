import { MeetingManager } from './MeetingManager';

export const MeetingInfoEndpoint: string = 'https://i38eaxbmk2.execute-api.us-east-1.amazonaws.com/Prod/meeting';
const meetingManager:MeetingManager = new MeetingManager(MeetingInfoEndpoint);


const updateUserInterface = () => {
    const data: any = meetingManager?.getInfo();
    document.getElementById('meeting-id').innerText = data.meetingId;
    document.getElementById('external-meeting-id').innerText = data.externalMeetingId;
    document.getElementById('attendee-id').innerText = data.attendeeId;

}

const joinClick = async (e: Event): Promise<void> => {
    console.log("join click!");
    const meetingId: string = "test123"; //todo get this from field or querystr
    await meetingManager.initialize(meetingId);
    updateUserInterface();
    return null;
}

export const attachEventListeners = async (): Promise<void> => {
    document.getElementById('join-button').addEventListener('click', joinClick);
    return null;
}
