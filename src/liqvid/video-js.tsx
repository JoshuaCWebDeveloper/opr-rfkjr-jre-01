import '@videojs/http-streaming';
import videojs, { VideoJsPlayer as Player } from 'video.js';
//import 'video.js/dist/video-js.css';
import { Media } from 'liqvid';

import styled from 'styled-components';

const StyledVideo = styled.video`
    position: relative;
    width: 100%;

    .vjs-hidden,
    &.vjs-controls-disabled .vjs-control-bar {
        display: none;
    }

    .vjs-seeking .vjs-loading-spinner,
    .vjs-waiting .vjs-loading-spinner {
        animation: vjs-spinner-show 0s linear 0.3s forwards;
        display: block;
    }

    .vjs-loading-spinner {
        background-clip: padding-box;
        border: 6px solid #2b333fb3;
        border-radius: 25px;
        box-sizing: border-box;
        display: none;
        height: 50px;
        left: 50%;
        margin: -25px 0 0 -25px;
        opacity: 0.85;
        position: absolute;
        text-align: left;
        top: 50%;
        visibility: hidden;
        width: 50px;
    }

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
        const { start } = this.props;

        // Create the video.js player instance
        this.videoJsPlayer = videojs(this.domElement, {
            html5: {
                hls: {
                    overrideNative: true,
                },
            },
            controls: false,
            bigPlayButton: false,
        });

        // Set the start time if specified
        if (start) {
            this.videoJsPlayer.currentTime(start);
        }

        // enable play/pause on click
        this.videoJsPlayer.on('click', () => {
            // pass event to video element
            this.domElement.click();
        });
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
        const {
            start: _3,
            children,
            obstructCanPlay: _1,
            obstructCanPlayThrough: _2,
            ...props
        } = this.props;

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
                {...props}
            >
                {children}
            </StyledVideo>
        );
    }
}
