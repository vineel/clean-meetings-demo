import { MeetingManager } from './MeetingManager';

export const MeetingInfoEndpoint: string = 'https://i38eaxbmk2.execute-api.us-east-1.amazonaws.com/Prod/meeting';


export class MeetingUserInterface {
    meetingManager: MeetingManager;

    constructor() {
        this.meetingManager = new MeetingManager(MeetingInfoEndpoint);
    }

    async joinClick(e: Event): Promise<void> {
        console.log("join click!");
        const meetingId: string = "test123"; //todo get this from field or querystr
        this.meetingManager.initialize(meetingId);
    }

    async attachEventListeners(doc: Document): Promise<void> {
        doc.getElementById('join-button').addEventListener('click', async (e: Event): Promise<void> => this.joinClick(e));
    }
}
