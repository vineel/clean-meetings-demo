import * as ChimeSDK from 'amazon-chime-sdk-js';
import { MeetingInfo } from './MeetingInfo';




export class MeetingManager {
    meetingInfo: MeetingInfo;
    logger: ChimeSDK.Logger;
    deviceController: ChimeSDK.DefaultDeviceController | undefined = undefined;
    meetingSession: ChimeSDK.MeetingSession | undefined;
    eventReporter: ChimeSDK.EventReporter | undefined = undefined;
    audioVideo: ChimeSDK.AudioVideoFacade | null = null;

    constructor(meetingInfoApiEndpoint: string) {
        this.meetingInfo = new MeetingInfo(meetingInfoApiEndpoint);
        this.meetingSession = undefined;
        this.deviceController = undefined;
        this.eventReporter = undefined;
        this.audioVideo = null;
    }

    getInfo(): Object {
        return {
            meetingId: this.meetingInfo?.getMeetingId(),
            externalMeetingId: this.meetingInfo.getExternalMeetingId(),
            attendeeId: this.meetingInfo?.getAttendeeId()
        };
    }

    async initialize(meetingId: string): Promise<void> {
        this.logger = new ChimeSDK.ConsoleLogger('Log');
        await this.meetingInfo.getOrCreateMeetingWithAttendee(meetingId);
        console.log("data:", this.meetingInfo.configuration);

        const configuration = this.meetingInfo.configuration;

        this.deviceController = new ChimeSDK.DefaultDeviceController(
            this.logger,
            { enableWebAudio: true }
        );
        console.log("deviceController:", this.deviceController);

        this.meetingSession = new ChimeSDK.DefaultMeetingSession(
            configuration,
            this.logger,
            this.deviceController,
            new ChimeSDK.DefaultEventController(
                configuration,
                this.logger,
                this.eventReporter // this is undefined bec I don't know how to use it
            )
        );
        console.log("meetingSession:", this.meetingSession);

        this.audioVideo = this.meetingSession.audioVideo;
    }
}
