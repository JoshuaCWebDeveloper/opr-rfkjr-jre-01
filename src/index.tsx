import { createRoot } from 'react-dom/client';

import { LiqvidVideo } from './liqvid';
import { VideoJs } from './liqvid/video-js';
import { Player } from './player';
import styled from 'styled-components';
import { useCallback, useRef } from 'react';
import { Script } from 'liqvid';

const Video = VideoJs as unknown as typeof LiqvidVideo;

const StyledApp = styled.div`
    display: flex;
    height: 100%;

    .lv-player {
        flex: 1;
    }

    .blocks {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 5px;
        position: absolute;
        right: 0;
        width: 20%;
        z-index: 1;
    }

    .block {
        background: rgb(255, 255, 255);
        border: 1px solid rgb(204, 204, 204);
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        padding: 1rem;
        transition: opacity 0.3s ease-in-out;
        word-break: break-word;
    }

    .annotation-list {
        flex: 0 0 20rem;
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 0.5rem;
        margin-left: 1rem;
        background: #fff;
        overflow-y: auto;
    }

    .annotation {
        cursor: pointer;
        margin-bottom: 1rem;
    }

    .annotation time {
        font-size: 0.8rem;
        color: #666;
    }

    .annotation h2 {
        font-size: 1rem;
        margin: 0;
    }
`;

// parse an SMPTE timecode into milliseconds
function parseTimecode(timecode: string): number {
    const parts = timecode.split(':').map(Number);

    if (parts.some(isNaN)) {
        throw new Error(`Invalid timecode: ${timecode}`);
    }

    let milliseconds = 0;

    if (parts.length === 3) {
        const [hours, minutes, seconds] = parts;
        milliseconds = (hours * 60 + minutes) * 60 * 1000 + seconds * 1000;
    } else if (parts.length === 2) {
        const [minutes, seconds] = parts;
        milliseconds = (minutes * 60 + seconds) * 1000;
    } else {
        throw new Error(`Invalid timecode: ${timecode}`);
    }

    return milliseconds;
}

const annotations = [
    [
        '15:45',
        '17:15',
        'Porter Bridges',
        `https://www.amazon.com/Bad-Reaction-Memoir-Sarah-Bridges/dp/1634505379`,
    ],
    [
        '22:00',
        '24:20',
        'Thimerosal: preservative or adjuvant?',
        `
        https://www.cdc.gov/vaccinesafety/concerns/thimerosal/index.html
        https://www.cdc.gov/vaccinesafety/concerns/adjuvants.html
        `,
    ],
    [
        '24:45',
        '28:30',
        'Ethyl mercury',
        `https://en.wikipedia.org/wiki/Ethylmercury`,
    ],
];

function App() {
    const scriptRef = useRef<Script | null>(null);

    const handleScriptChange = useCallback(
        (script: Script) => {
            scriptRef.current = script;
        },
        [scriptRef]
    );

    const createHandleAnnotationNav = (timecode: string) => () => {
        const script = scriptRef.current;
        if (script) {
            const time = parseTimecode(timecode);
            script.playback.seek(time - 2000);
            script.playback.play();
        }
    };

    return (
        <StyledApp>
            <Player
                className="content"
                duration={(3 * 60 + 20) * 60 * 1000}
                onScriptChange={handleScriptChange}
            >
                <div className="blocks">
                    {annotations.map(([start, end, title, text]) => (
                        <section
                            className="block"
                            key={start}
                            data-enter={parseTimecode(start)}
                            data-exit={parseTimecode(end)}
                        >
                            <h2>{title}</h2>
                            <p>{text}</p>
                        </section>
                    ))}
                </div>

                <Video start={15000}>
                    <source
                        src="http://localhost:3001/video/jre-1999.m3u8"
                        type="application/x-mpegURL"
                    />
                </Video>
            </Player>

            <div className="annotation-list">
                {annotations.map(([start, _end, title]) => (
                    <section
                        className="annotation"
                        key={start}
                        onClick={createHandleAnnotationNav(start)}
                    >
                        <time>{start}</time>
                        <h2>{title}</h2>
                    </section>
                ))}
            </div>
        </StyledApp>
    );
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.querySelector('main')!).render(<App />);
