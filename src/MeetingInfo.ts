import * as ChimeSDK from 'amazon-chime-sdk-js';



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
        let data: any = await response.json();
        console.log(JSON.stringify(data, null, 2));

        this.configuration = new ChimeSDK.MeetingSessionConfiguration(data.Meeting, data.Attendee);
    }

    getMeetingConfig(): Object {
        return this.configuration;
    }

    toString(): string {
        return JSON.stringify(this.meetingInfoApiEndpoint, null, 2);
    }
}
