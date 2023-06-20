import '@videojs/http-streaming';
import videojs, { VideoJsPlayer as Player } from 'video.js';
//import 'video.js/dist/video-js.css';
import { Media } from 'liqvid';

import styled from 'styled-components';

const StyledVideo = styled.video`
    width: 100%;

    video {
        width: 100%;
    }
`;

/** Liqvid equivalent of {@link HTMLVideoElement `<video>`}. */
export class VideoJs extends Media {
    /** The underlying `video.js` player instance. */
    private videoJsPlayer?: Player;

    /** The underlying `<video>` element. */
    declare domElement: HTMLVideoElement;

    instantiateVideoJs() {
        const {
            start,
            children: _,
            obstructCanPlay: _1,
            obstructCanPlayThrough: _2,
            ...attrs
        } = this.props;

        // Create the video.js player instance
        this.videoJsPlayer = videojs(this.domElement, {
            html5: {
                hls: {
                    overrideNative: true,
                },
            },
            ...attrs,
        });

        // Set the start time if specified
        if (start) {
            this.videoJsPlayer.currentTime(start);
        }
    }

    // WARNING: The Liqvid Media base class gives us no way to execute code on unmount.
    // This means that we can't dispose the video.js player instance.
    // componentWillUnmount() {
    //     // Dispose the video.js player instance
    //     if (this.player) {
    //         this.player.dispose();
    //     }
    // }

    override render() {
        return (
            <StyledVideo
                ref={node => {
                    if (!node) {
                        return;
                    }
                    this.domElement = node;
                    this.instantiateVideoJs();
                }}
                className="video-js vjs-default-skin vjs-big-play-centered"
            >
                {this.props.children}
            </StyledVideo>
        );
    }
}
