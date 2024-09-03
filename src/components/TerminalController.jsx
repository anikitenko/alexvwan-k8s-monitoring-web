import {useContext, useEffect, useRef, useState} from "react";
import Terminal, {ColorMode, TerminalOutput} from 'react-terminal-ui';

import './TerminalController.css'
import {ErrorHandlingToastContext} from "../ErrorHandlingToastContext";
import Button from "react-bootstrap/Button";
import GetApiRequest from "./GetApiRequest";

const TerminalController = ({terminalControllerShow, setTerminalControllerShow, terminalControllerShowMinimized, setTerminalControllerShowMinimized}) => {
    const errorHandler = useContext(ErrorHandlingToastContext)
    const [terminalLineData, setTerminalLineData] = useState([]);
    const terminalRef = useRef(null);
    const shouldScrollRef = useRef(true);

    const currentTime = new Date().toISOString();
    const [firstDocumentTime, setFirstDocumentTime] = useState(currentTime);

    useEffect(() => {
        GetApiRequest(
            '/lac-data?time=' + currentTime,
            'TerminalController',
            data => {
                let terminalLines = [];
                data.forEach((element) => {
                    terminalLines.push(<TerminalOutput key={element.time}>[{element.time}][{element.type}]: {element.message}</TerminalOutput>)
                });
                setFirstDocumentTime(data[0].time);
                setTerminalLineData(terminalLines);
            },
            error => {
                errorHandler.addToast(error, 'danger');
            }
        )

        // Create a new EventSource instance to listen to the SSE endpoint
        const eventSource = new EventSource('https://localhost/lac?time=' + currentTime);

        // Listen for messages (events) from the server
        eventSource.onmessage = (event) => {
            if (terminalRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
                shouldScrollRef.current = scrollTop + clientHeight >= scrollHeight - 10; // small threshold
            }

            // Parse the event data (which should be in JSON format)
            const newLogs = JSON.parse(event.data);
            const newTerminalLines = newLogs.map((element) => (
                <TerminalOutput key={element.time}>
                    [{element.time}][{element.type}]: {element.message}
                </TerminalOutput>
            ));
            setTerminalLineData((prevItems) => [...prevItems, newTerminalLines]);
        };

        // Handle errors (e.g., server disconnected, network issues)
        eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
            errorHandler.addToast('EventSource failed: ' + error, 'danger');
            eventSource.close(); // Close the connection if there’s an error
        };

        // Cleanup when the component is unmounted
        return () => {
            eventSource.close();
        };
    }, []);

    useEffect(() => {
        // Scroll to the bottom when new content is added
        if (shouldScrollRef.current && terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalLineData]);

    return (
        <div className={`custom-terminal-wrapper ${terminalControllerShowMinimized ? 'minimized' : ''}`} hidden={!terminalControllerShow}>
            <Terminal name='Activity Console' colorMode={ColorMode.Dark} height='180pt'
                      redBtnCallback={() => setTerminalControllerShow(false)}
                      yellowBtnCallback={() => setTerminalControllerShowMinimized(true)}
                      greenBtnCallback={() => setTerminalControllerShowMinimized(false)}>
                <div ref={terminalRef} className="terminal-content">
                    <Button variant="secondary" size="sm">Load more logs</Button>
                    {terminalLineData}
                    <TerminalOutput>
                        <div className="terminal-loading">Receiving events...</div>
                    </TerminalOutput>
                </div>
            </Terminal>
        </div>
)
};

export default TerminalController;
