import { createRoot } from 'react-dom/client';

import { VideoJs } from './liqvid/video-js';
import { Player } from './player';
import styled from 'styled-components';
import { useCallback, useRef } from 'react';
import { Script } from 'liqvid';

const StyledApp = styled.div`
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS',
        sans-serif;

    display: flex;
    height: 100%;

    .player {
        display: flex;
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

    .title-screen {
        background: #222;
        color: #e1e1e1;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        position: absolute;
        transition: opacity 1s ease-in-out;
        width: 100%;
        height: 100%;

        h1 {
            margin: 40px;
            font-size: 3em;
        }

        p {
            margin: 20px;
            font-size: 2em;
        }
    }

    .video-container {
        position: absolute;
        transition: opacity 1s ease-in-out;
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
        '0:40',
        '2:10',
        'Porter Bridges',
        `https://www.amazon.com/Bad-Reaction-Memoir-Sarah-Bridges/dp/1634505379`,
    ],
    [
        '6:55',
        '9:15',
        'Thimerosal: preservative or adjuvant?',
        `
        https://www.cdc.gov/vaccinesafety/concerns/thimerosal/index.html
        https://www.cdc.gov/vaccinesafety/concerns/adjuvants.html
        `,
    ],
    [
        '9:40',
        '13:25',
        'Ethyl mercury',
        `https://en.wikipedia.org/wiki/Ethylmercury`,
    ],
    [
        '0:32:30',
        '0:37:10',
        'Where Spanish Flu Deaths Vaccine Induced?',
        `Sub-Claim: Spanish Flu was a bacterial infection, not a virus:
        https://www.nih.gov/news-events/news-releases/bacterial-pneumonia-caused-most-deaths-1918-influenza-pandemic
        `,
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

    const title = <h1>The Joe Rogan Experience #1999 - Robert Kennedy, Jr.</h1>;

    return (
        <StyledApp>
            <Player
                className="content"
                duration={parseTimecode('40:00')}
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

                <div
                    className="title-screen"
                    data-enter={parseTimecode('0:00')}
                    data-exit={parseTimecode('0:10')}
                >
                    {title}
                    <p>Porter Bridges</p>
                    <p>Thimerosal: preservative or adjuvant?</p>
                    <p>Ethyl mercury</p>
                </div>

                <VideoJs
                    data-enter={parseTimecode('0:10')}
                    data-exit={parseTimecode('30:00')}
                    playbackStart={parseTimecode('15:00')}
                >
                    <source
                        src="http://localhost:3001/video/jre-1999.m3u8"
                        type="application/x-mpegURL"
                    />
                </VideoJs>

                <div
                    className="title-screen"
                    data-enter={parseTimecode('30:00')}
                    data-exit={parseTimecode('30:10')}
                >
                    {title}
                    <p>Where Spanish Flu Deaths Vaccine Induced?</p>
                </div>

                <VideoJs
                    data-enter={parseTimecode('30:10')}
                    data-exit={parseTimecode('40:00')}
                    playbackStart={parseTimecode('1:50:00')}
                >
                    <source
                        src="http://localhost:3001/video/jre-1999.m3u8"
                        type="application/x-mpegURL"
                    />
                </VideoJs>
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
