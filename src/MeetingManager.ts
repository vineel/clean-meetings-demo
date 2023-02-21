import * as ChimeSDK from 'amazon-chime-sdk-js';
import { MeetingInfo } from './MeetingInfo';




export class MeetingManager {
    meetingInfo: MeetingInfo;
    logger: ChimeSDK.Logger;

    constructor(meetingInfoApiEndpoint: string) {
        this.meetingInfo = new MeetingInfo(meetingInfoApiEndpoint);
    }

    async initialize(meetingId: string): Promise<void> {
        this.logger = new ChimeSDK.ConsoleLogger('Log');
        await this.meetingInfo.getOrCreateMeetingWithAttendee(meetingId);
        console.log("data:", this.meetingInfo.configuration);

        const presentAttendeeId: string = this.meetingInfo.configuration.credentials.attendeeId;
        console.log('presentAttendeeId - ', presentAttendeeId);
    }
}
