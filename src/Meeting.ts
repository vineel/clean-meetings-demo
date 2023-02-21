import * as ChimeSDK from 'amazon-chime-sdk-js';
const MeetingInfoEndpoint: string = 'https://i38eaxbmk2.execute-api.us-east-1.amazonaws.com/Prod/meeting';


export class MeetingInfo {    
    meetingInfoApiEndpoint: string;
    configuration: any;

    constructor(meetingInfoUrl: string) {
        this.meetingInfoApiEndpoint = meetingInfoUrl;
    }
    
    async getOrCreateMeetingWithAttendee(meetingId: string) {
        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        };
        let response: any = await fetch(this.meetingInfoApiEndpoint + "?m=" + meetingId, options);
        let data:any = await response.json();
        console.log(JSON.stringify(data, null, 2));

        this.configuration = new ChimeSDK.MeetingSessionConfiguration(data.Meeting, data.Attendee);
    }

    getMeetingConfig() : Object {
        return this.configuration;
    }

    toString(): string {
        return JSON.stringify(this.meetingInfoApiEndpoint, null, 2);
    }
}

export class MeetingManager {
    meetingInfo: MeetingInfo;
    logger: ChimeSDK.Logger;

    constructor(meetingInfoApiEndpoint:string) {
        this.meetingInfo = new MeetingInfo(meetingInfoApiEndpoint);
    }

    async initialize(meetingId: string): Promise<void> {
        this.logger = new ChimeSDK.ConsoleLogger('Log');
        await this.meetingInfo.getOrCreateMeetingWithAttendee(meetingId);
        console.log("data:", this.meetingInfo.configuration);

        const presentAttendeeId:string = this.meetingInfo.configuration.credentials.attendeeId;
        console.log('presentAttendeeId - ',presentAttendeeId); 
    }
}


export class UserInterface {
    meetingManager: MeetingManager;

    constructor() {
        this.meetingManager = new MeetingManager(MeetingInfoEndpoint);
    }

    async joinClick(e: Event): Promise<void> {
        console.log("join click!");
        const meetingId:string = "test123"; //todo get this from field or querystr
        this.meetingManager.initialize(meetingId)
    }

    async attachEventListeners(document : Document): Promise<void> {
        document.getElementById('join-button').addEventListener('click', async (e: Event)=>{
            this.joinClick(e);
        });
    }
}
