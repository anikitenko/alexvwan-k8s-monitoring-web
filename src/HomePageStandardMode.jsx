import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import InputGroup from "react-bootstrap/InputGroup";
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from "react-bootstrap/Form";
import Card from 'react-bootstrap/Card';
import Tab from 'react-bootstrap/Tab';
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Tooltip from 'react-bootstrap/Tooltip';
import React, {useCallback, useContext, useEffect, useRef, useState} from "react";

import {ErrorHandlingToastContext} from "./ErrorHandlingToastContext";
import GetApiRequest from "./components/GetApiRequest";
import Table from "react-bootstrap/Table";
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';

import {ArrowDownSquare, EyeFill} from "react-bootstrap-icons";
import DeploymentOverview from "./HomePageStandardMode/workloads/deployments/DeploymentOverview";
import ListLabels from "./components/ListLabels";
import TerminalController from "./components/TerminalController";

function HomePageStandardMode({switchToEditMode}) {
    const [activeWorkloadTab, setActiveWorkloadTab] = useState('deployments');
    const [filterListWorkloadItemsPattern, setFilterListWorkloadItemsPattern] = useState("");
    const [filterListWorkloadItemsOnlyFailed, setFilterListWorkloadItemsOnlyFailed] = useState(false);
    const [terminalControllerShow, setTerminalControllerShow] = useState(true);
    const [terminalControllerShowMinimized, setTerminalControllerShowMinimized] = useState(true);
    const [state, setState] = useState({
        filtersPlaceholder: 'Filter by labels',
        showFiltersPopover: false,
        targetFiltersPopover: null,
        dataLoading: false,
        filtersList: [],
        listWorkloadItemsOriginal: [],
        kubeconfigsList: [],
        clustersList: [],
        selectedConfigID: 'ignore',
        selectedClusterName: 'ignore',
        namespacesList: [],
        selectedNamespace: 'ignore',
        workloadsActiveTab: 'deployments',
        workloads: {
            deployments: {list: [], originalList: [], activeKey: '', showOverview: false, current: ''},
            stateFulSets: {list: [], originalList: [], activeKey: ''},
            daemonSets: {list: [], originalList: [], activeKey: ''},
            jobs: {list: [], originalList: [], activeKey: ''},
            cronJobs: {list: [], originalList: [], activeKey: ''},
            pods: {list: [], originalList: [], activeKey: ''},
            replicaSets: {list: [], originalList: [], activeKey: ''},
            replicaControllers: {list: [], originalList: [], activeKey: ''},
        },
    });
    const errorHandler = useContext(ErrorHandlingToastContext)

    const handleSelectedConfigChanges = (e) => {
        if (e.target.value === "ignore") {
            return
        }
        setState(prevState => ({
            ...prevState,
            selectedConfigID: e.target.value,
            clustersList: state.kubeconfigsList.find(item => item.id === e.target.value)?.clusters || [],
            selectedClusterName: "ignore",
            workloads: {
                ...prevState.workloads,
                deployments: {
                    ...prevState.workloads.deployments,
                    list: []
                },
                stateFulSets: {
                    ...prevState.workloads.stateFulSets,
                    list: []
                },
                daemonSets: {
                    ...prevState.workloads.daemonSets,
                    list: []
                },
                jobs: {
                    ...prevState.workloads.jobs,
                    list: []
                },
                cronJobs: {
                    ...prevState.workloads.cronJobs,
                    list: []
                },
                pods: {
                    ...prevState.workloads.pods,
                    list: []
                },
                replicaSets: {
                    ...prevState.workloads.replicaSets,
                    list: []
                },
                replicaControllers: {
                    ...prevState.workloads.replicaControllers,
                    list: []
                }
            },
            namespacesList: [],
            selectedNamespace: "ignore"
        }));
    }
    const handleSelectedClusterNameChanges = (e) => {
        const clusterName = e.target.value;
        if (clusterName === "ignore") {
            setState(prevState => ({...prevState, namespacesList: []}));
            return
        }
        setState(prevState => (
            {
                ...prevState,
                dataLoading: true,
                selectedClusterName: clusterName
            }
        ));
        GetApiRequest(
            '/getK8sClustersNSs/' + state.selectedConfigID + "/" + clusterName,
            'namespaces',
            data => {
                setState(prevState => (
                    {
                        ...prevState,
                        dataLoading: false,
                        namespacesList: data
                    }
                ));
            },
            error => {
                errorHandler.addToast(error, 'danger');
            }
        )
        let _e = {};
        _e.target = {};
        _e.target.value = state.selectedNamespace
        if (state.selectedNamespace !== "ignore") handleSelectedNamespace(_e, clusterName)
    }
    const handleSelectedNamespace = (e, clusterNameOverride) => {
        const ns = e.target.value;
        if (ns === "ignore") {
            return
        }
        setState(prevState => (
            {
                ...prevState,
                dataLoading: true,
                selectedNamespace: ns
            }
        ));

        const currentClusterName = clusterNameOverride ?? state.selectedClusterName;

        getWorkloads(currentClusterName, ns)
    }

    const getWorkloads = useCallback((cluster, ns, activeTab) => {
        const currentClusterName = cluster ?? state.selectedClusterName;
        const currentNsName = ns ?? state.selectedNamespace;
        const currentActiveTab = activeTab ?? state.workloadsActiveTab;
        GetApiRequest(
            '/getK8s' + currentActiveTab + '/' + state.selectedConfigID + "/" + currentClusterName + "/" + currentNsName,
            state.workloadsActiveTab,
            data => {
                setState(prevState => ({
                    ...prevState,
                    dataLoading: false,
                    workloads: {
                        ...prevState.workloads,
                        [currentActiveTab]: {
                            ...prevState.workloads[currentActiveTab],
                            list: data,
                            originalList: data,
                            activeKey: data[0]?.id ?? ""
                        }
                    }
                }));
            },
            error => {
                errorHandler.addToast(error, 'danger');
            }
        )
    }, [errorHandler, state.selectedClusterName, state.selectedConfigID, state.selectedNamespace, state.workloadsActiveTab])

    useEffect(() => {
        setState(prevState => ({
            ...prevState,
            dataLoading: true
        }));
        GetApiRequest(
            '/getKubeconfigs',
            'kubeconfigs',
            data => {
                setState(prevState => ({
                    ...prevState,
                    dataLoading: false,
                    kubeconfigsList: data
                }));
            },
            error => {
                errorHandler.addToast(error, 'danger');
            }
        )
    }, [errorHandler])

    const popoverSelectors = (labels) => {
        return (
            labels.map((i, idx) => (
                <div key={idx}>
                    <Badge pill bg="light" text="dark">
                        {i}
                    </Badge>
                </div>
            ))
        )
    }

    const applyLabelFilters = useCallback(() => {
        let filteredData = [];
        if (state.filtersList.length > 0) {
            filteredData = state.workloads[state.workloadsActiveTab].originalList.filter(item => {
                return item.labels.some(label =>
                    state.filtersList.some(filter => label.includes(filter))
                );
            });
        } else {
            filteredData = [...state.workloads[state.workloadsActiveTab].originalList]
        }
        setState(prevState => ({
            ...prevState,
            workloads: {
                ...prevState.workloads,
                [state.workloadsActiveTab]: {
                    ...prevState.workloads[state.workloadsActiveTab],
                    list: filteredData
                }
            }
        }));
        setState(prevState => ({
            ...prevState,
            listWorkloadItemsOriginal: filteredData
        }));
    }, [state.filtersList, state.workloads[state.workloadsActiveTab].originalList, state.workloadsActiveTab])

    useEffect(() => {
        if (state.filtersList.length > 0) {
            setState(prevState => ({
                ...prevState,
                filtersPlaceholder: "Filter by labels (" + state.filtersList.length + " applied)"
            }));
        } else {
            setState(prevState => ({
                ...prevState,
                filtersPlaceholder: "Filter by labels)",
                showFiltersPopover: false
            }));
        }
        applyLabelFilters();
    }, [applyLabelFilters, state.filtersList]);

    const filterListButtonRef = useRef();

    const handlefiltersPopoverClick = (event) => {
        setState(prevState => ({
            ...prevState,
            targetFiltersPopover: event.target,
            showFiltersPopover: !state.showFiltersPopover
        }));
    };

    const addFiltersSubmit = (e) => {
        e.preventDefault();
        //First input field value
        let filter = e.target.elements[0].value
        if (filter === "") {
            return
        }
        addFilters(filter);

        if (!state.showFiltersPopover) {
            filterListButtonRef.current.click();
        }
        e.target.elements[0].value = "";
    }

    const addFilters = (filter) => {
        if (filter === "") {
            return
        }
        setState(prevState => {
            // Check if the filter already exists
            let isFilterUnique = !prevState.filtersList.includes(filter);

            // If unique, add it; otherwise, return the same state
            return isFilterUnique ? {
                ...prevState,
                filtersList: [...prevState.filtersList, filter]
            } : prevState;
        });
    }

    const removeFilters = (filter) => {
        setState(prevState => ({
            ...prevState,
            filtersList: prevState.filtersList.filter((name) => name !== filter)
        }));
    }

    /*
    useEffect(() => {
        setState(prevState => ({
            ...prevState,
            workloads: {
                ...prevState.workloads,
                deployments: {
                    ...prevState.workloads.deployments,
                    activeKey: (state.workloads.deployments.list ?? [])[0]?.id ?? ""
                }
            }
        }));
    }, [state.workloads.deployments.list]);
    */

    useEffect(() => {
        setState(prevState => {
            let updatedWorkloads = {...prevState.workloads};

            for (const key in prevState.workloads) {
                updatedWorkloads[key] = {
                    ...prevState.workloads[key],
                    activeKey: (prevState.workloads[key].list ?? [])[0]?.id ?? ""
                };
            }

            return {
                ...prevState,
                workloads: updatedWorkloads
            };
        });
    }, Object.values(state.workloads).map(workload => workload.list));

    useEffect(() => {
        applyLabelFilters();
    }, [applyLabelFilters]);

    const workloadSwitchTab = (e) => {
        setState(prevState => ({
            ...prevState,
            workloadsActiveTab: e
        }));
        if (state.selectedClusterName !== "ignore" && state.selectedNamespace !== "ignore") {
            getWorkloads(state.selectedClusterName, state.selectedNamespace, e);
        }
    }

    const filterWorkloadsItems = (e) => {
        setFilterListWorkloadItemsPattern(e.target.value);
    }

    const setFilterWorkloadsItemsOnlyFailed = (e) => {
        setFilterListWorkloadItemsOnlyFailed(e.target.checked)
    }

    React.useEffect(() => {
        const filteredData = state.listWorkloadItemsOriginal.filter(
            (item) =>
                (!filterListWorkloadItemsOnlyFailed || !item.condition.ok) &&
                item.name.includes(filterListWorkloadItemsPattern)
        );
        setState((prevState) => ({
            ...prevState,
            workloads: {
                ...prevState.workloads,
                [state.workloadsActiveTab]: {
                    ...prevState.workloads[state.workloadsActiveTab],
                    list: filteredData,
                },
            },
        }));
    }, [filterListWorkloadItemsPattern, filterListWorkloadItemsOnlyFailed]);

    return (
        <>
            <Navbar expand="lg">
                <Container>
                    <Navbar.Brand href="/">K8S Monitoring</Navbar.Brand>
                    <DropdownButton
                        drop={"down-centered"}
                        variant="primary"
                        title={"Options"}
                    >
                        <Dropdown.Item onClick={() => switchToEditMode()}>Manage Kubeconfigs</Dropdown.Item>
                        <Dropdown.Item onClick={() => setTerminalControllerShow(true)}>Toggle Activity
                            Console</Dropdown.Item>
                    </DropdownButton>
                </Container>
            </Navbar>
            <Navbar expand="md">
                <Form className='form-inline'>
                    <InputGroup>
                        <InputGroup.Text>Kubeconfig</InputGroup.Text>
                        <Form.Select disabled={state.dataLoading} onChange={handleSelectedConfigChanges}>
                            <option value={"ignore"}>Select...</option>
                            {state.kubeconfigsList?.map((item) =>
                                <option key={item.id} value={item.id}>{item.name}</option>
                            )}
                        </Form.Select>
                    </InputGroup>
                </Form>
                <Form className='form-inline m-sm-2'>
                    <InputGroup>
                        <InputGroup.Text>Cluster</InputGroup.Text>
                        <Form.Select disabled={state.dataLoading} onChange={handleSelectedClusterNameChanges}>
                            <option value={"ignore"}>Select...</option>
                            {state.clustersList?.map((item) =>
                                <option key={item.id}
                                        value={item.name}>{item.name}</option>
                            )}
                        </Form.Select>
                    </InputGroup>
                </Form>
                <Form className='form-inline m-sm-2'>
                    <InputGroup>
                        <InputGroup.Text>Namespace</InputGroup.Text>
                        <Form.Select disabled={state.dataLoading} onChange={handleSelectedNamespace}>
                            <option value={"ignore"}>Select...</option>
                            {state.namespacesList?.map((item) =>
                                <option key={item} value={item}>{item}</option>
                            )}
                        </Form.Select>
                    </InputGroup>
                </Form>
                <Form className='form-inline' onSubmit={addFiltersSubmit}>
                    <InputGroup>
                        <Form.Control type="text" size="sm"
                                      placeholder={state.filtersPlaceholder}
                                      style={{width: '400px', borderBottom: '2px solid #000'}}/>
                        <OverlayTrigger
                            placement="bottom"
                            shouldUpdatePosition={true}
                            show={state.showFiltersPopover}
                            target={state.targetFiltersPopover}
                            onHide={() => setState(prevState => ({...prevState, showFiltersPopover: false}))}
                            overlay={
                                <Popover id="popover-basic">
                                    <Popover.Body>
                                        {state.filtersList.map((i, idx) => (
                                            <div key={idx}>
                                                <Badge pill bg="secondary" text="light">
                                                    {i}
                                                </Badge>
                                                <Badge bg="danger" style={{cursor: "pointer"}}
                                                       onClick={() => removeFilters(i)}>X</Badge>
                                            </div>
                                        ))}
                                        {state.filtersList.length === 0 && <div>No current filters</div>}
                                    </Popover.Body>
                                </Popover>
                            }
                            rootClose>
                            <Button
                                size="sm"
                                variant="outline-primary"
                                ref={filterListButtonRef}
                                style={{borderBottom: '2px solid #000'}}
                                onClick={handlefiltersPopoverClick}>
                                <ArrowDownSquare/>
                            </Button>
                        </OverlayTrigger>
                    </InputGroup>
                </Form>
            </Navbar>
            <Card className={"mt-2"}>
                <Card.Header className="text-center"><h2>Workloads</h2></Card.Header>
                <Nav fill variant="tabs"
                     defaultActiveKey="deployments"
                     onSelect={workloadSwitchTab}
                     activeKey={activeWorkloadTab}>
                    <Nav.Item>
                        <Nav.Link eventKey="deployments"
                                  onClick={() => setActiveWorkloadTab('deployments')}>
                            <h5>Deployments <Badge bg="primary">{state.workloads.deployments.list.length}</Badge></h5>
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="stateFulSets"
                                  onClick={() => setActiveWorkloadTab('stateFulSets')}>
                            <h5>StatefulSets <Badge bg="primary">{state.workloads.stateFulSets.list.length}</Badge></h5>
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="daemonSets"
                                  onClick={() => setActiveWorkloadTab('daemonSets')}>
                            <h5>DaemonSets <Badge bg="primary">{state.workloads.daemonSets.list.length}</Badge></h5>
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="jobs"
                                  onClick={() => setActiveWorkloadTab('jobs')}>
                            <h5>Jobs <Badge bg="primary">{state.workloads.jobs.list.length}</Badge></h5>
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="cronJobs"
                                  onClick={() => setActiveWorkloadTab('cronJobs')}>
                            <h5>CronJobs <Badge bg="primary">{state.workloads.cronJobs.list.length}</Badge></h5>
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="pods"
                                  onClick={() => setActiveWorkloadTab('pods')}>
                            <h5>Pods <Badge bg="primary">{state.workloads.pods.list.length}</Badge></h5>
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="replicaSets"
                                  onClick={() => setActiveWorkloadTab('replicaSets')}>
                            <h5>ReplicaSets <Badge bg="primary">{state.workloads.replicaSets.list.length}</Badge></h5>
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="replicaControllers"
                                  onClick={() => setActiveWorkloadTab('replicaControllers')}>
                            <h5>Replication Controllers <Badge
                                bg="primary">{state.workloads.replicaControllers.list.length}</Badge></h5>
                        </Nav.Link>
                    </Nav.Item>
                </Nav>
                {activeWorkloadTab === 'deployments' && (
                    <Tab.Content>
                        <div style={{height: '320px', overflow: "auto"}}>
                            <Tab.Container onSelect={(k) => setState(prevState => ({
                                ...prevState,
                                workloads: {
                                    ...prevState.workloads,
                                    deployments: {
                                        ...prevState.workloads.deployments,
                                        activeKey: k
                                    }
                                }
                            }))}
                                           activeKey={state.workloads.deployments.activeKey}
                                           defaultActiveKey={(state.workloads.deployments.list && state.workloads.deployments.list.length > 0) ? state.workloads.deployments.list[0].id : ''}>
                                <Row>
                                    <Col sm={3}>
                                        <InputGroup className={"m-sm-2"}
                                                    hidden={state.workloads.deployments.originalList.length === 0}>
                                            <InputGroup.Checkbox onChange={setFilterWorkloadsItemsOnlyFailed}
                                                                 aria-label="Checkbox for filtering failed workload"/>
                                            <Form.Control type="text" placeholder="Filter deployments"
                                                          aria-label="Filter deployments"
                                                          onChange={filterWorkloadsItems}
                                            />
                                        </InputGroup>
                                        <div style={{height: '300px', overflow: 'auto'}}>
                                            <Nav variant="pills" className="flex-column">
                                                {state.workloads.deployments.list?.map((item) =>
                                                    <Nav.Item key={item.id}>
                                                        <Nav.Link eventKey={item.id}>
                                                            <OverlayTrigger
                                                                placement="right"
                                                                overlay={
                                                                    <Tooltip>
                                                                        {item.condition.message}
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <Badge bg={item.condition.ok ? "success" : "danger"}>
                                                                    {item.condition.ok ? '✔️' : 'X'}
                                                                </Badge>
                                                            </OverlayTrigger>
                                                            &nbsp; {item.name}
                                                        </Nav.Link>
                                                    </Nav.Item>
                                                )}
                                            </Nav>
                                        </div>
                                    </Col>
                                    <Col sm={9}>
                                        <Tab.Content>
                                            {state.workloads.deployments.list?.map((item) => (
                                                <Tab.Pane eventKey={item.id} key={item.id}>
                                                    <Table striped bordered hover>
                                                        <thead>
                                                        <tr>
                                                            <th>Status</th>
                                                            <th>Age</th>
                                                            <th>Labels</th>
                                                            <th>Containers</th>
                                                            <th>Selectors</th>
                                                            <th>View</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        <tr>
                                                            <td>{item.replicas}/{item.total_replicas}</td>
                                                            <td>{item.age}</td>
                                                            <td>
                                                                <ListLabels addFilters={addFilters} labels={item.labels}
                                                                            selector={false} newLine={true}/>
                                                            </td>
                                                            <td>
                                                                {item.containers?.slice(0, 2).map((i, idx) => (
                                                                    <div key={idx}>{i}</div>
                                                                ))}
                                                            </td>
                                                            <td>
                                                                <ListLabels labels={item.selectors} selector={true}
                                                                            newLine={true}/>
                                                            </td>
                                                            <td style={{verticalAlign: "middle"}}>
                                                                <Button variant="primary"
                                                                        onClick={() => setState(prevState => ({
                                                                            ...prevState,
                                                                            workloads: {
                                                                                ...prevState.workloads,
                                                                                deployments: {
                                                                                    ...prevState.workloads.deployments,
                                                                                    showOverview: true,
                                                                                    current: item.name
                                                                                }
                                                                            }
                                                                        }))}>
                                                                    <EyeFill/>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                        </tbody>
                                                    </Table>
                                                </Tab.Pane>
                                            ))}
                                        </Tab.Content>
                                    </Col>
                                </Row>
                            </Tab.Container>
                        </div>
                    </Tab.Content>
                )}
                {activeWorkloadTab === 'stateFulSets' && (
                    <Tab.Content>
                        <div style={{height: '320px', overflow: "auto"}}>
                            <Tab.Container onSelect={(k) => setState(prevState => ({
                                ...prevState,
                                workloads: {
                                    ...prevState.workloads,
                                    stateFulSets: {
                                        ...prevState.workloads.stateFulSets,
                                        activeKey: k
                                    }
                                }
                            }))}
                                           activeKey={state.workloads.stateFulSets.activeKey}
                                           defaultActiveKey={(state.workloads.stateFulSets.list && state.workloads.stateFulSets.list.length > 0) ? state.workloads.stateFulSets.list[0].id : ''}>
                                <Row>
                                    <Col sm={3}>
                                        <InputGroup className={"m-sm-2"}
                                                    hidden={state.workloads.stateFulSets.originalList.length === 0}>
                                            <InputGroup.Checkbox onChange={setFilterWorkloadsItemsOnlyFailed}
                                                                 aria-label="Checkbox for filtering failed workload"/>
                                            <Form.Control type="text" placeholder="Filter Stateful Sets"
                                                          aria-label="Filter Stateful Sets"
                                                          onChange={filterWorkloadsItems}
                                            />
                                        </InputGroup>
                                        <div style={{height: '300px', overflow: 'auto'}}>
                                            <Nav variant="pills" className="flex-column">
                                                {state.workloads.stateFulSets.list?.map((item) =>
                                                    <Nav.Item key={item.id}>
                                                        <Nav.Link eventKey={item.id}>
                                                            <OverlayTrigger
                                                                placement="right"
                                                                overlay={
                                                                    <Tooltip>
                                                                        {item.condition.message}
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <Badge bg={item.condition.ok ? "success" : "danger"}>
                                                                    {item.condition.ok ? '✔️' : 'X'}
                                                                </Badge>
                                                            </OverlayTrigger>
                                                            &nbsp; {item.name}
                                                        </Nav.Link>
                                                    </Nav.Item>
                                                )}
                                            </Nav>
                                        </div>
                                    </Col>
                                    <Col sm={9}>
                                        <Tab.Content>
                                            {state.workloads.stateFulSets.list?.map((item) => (
                                                <Tab.Pane eventKey={item.id} key={item.id}>
                                                    <Table striped bordered hover>
                                                        <thead>
                                                        <tr>
                                                            <th>Labels</th>
                                                            <th>Desired</th>
                                                            <th>Current</th>
                                                            <th>Age</th>
                                                            <th>Selectors</th>
                                                            <th>View</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        <tr>
                                                            <td>
                                                                <ListLabels addFilters={addFilters} selector={false}
                                                                            labels={item.labels}
                                                                            newLine={true}/>
                                                            </td>
                                                            <td>{item.desired_replicas}</td>
                                                            <td>{item.current_replicas}</td>
                                                            <td>{item.age}</td>
                                                            <td>
                                                                <ListLabels labels={item.selectors} selector={true}
                                                                            newLine={true}/>
                                                            </td>
                                                            <td style={{verticalAlign: "middle"}}>
                                                                <Button variant="primary">
                                                                    <EyeFill/>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                        </tbody>
                                                    </Table>
                                                </Tab.Pane>
                                            ))}
                                        </Tab.Content>
                                    </Col>
                                </Row>
                            </Tab.Container>
                        </div>
                    </Tab.Content>
                )}
                {activeWorkloadTab === 'daemonSets' && (
                    <Tab.Content>
                        <div style={{height: '320px', overflow: "auto"}}>
                            <Tab.Container onSelect={(k) => setState(prevState => ({
                                ...prevState,
                                workloads: {
                                    ...prevState.workloads,
                                    daemonSets: {
                                        ...prevState.workloads.daemonSets,
                                        activeKey: k
                                    }
                                }
                            }))}
                                           activeKey={state.workloads.daemonSets.activeKey}
                                           defaultActiveKey={(state.workloads.daemonSets.list && state.workloads.daemonSets.list.length > 0) ? state.workloads.daemonSets.list[0].id : ''}>
                                <Row>
                                    <Col sm={3}>
                                        <InputGroup className={"m-sm-2"}
                                                    hidden={state.workloads.daemonSets.originalList.length === 0}>
                                            <InputGroup.Checkbox onChange={setFilterWorkloadsItemsOnlyFailed}
                                                                 aria-label="Checkbox for filtering failed workload"/>
                                            <Form.Control type="text" placeholder="Filter Daemon Sets"
                                                          aria-label="Filter Daemon Sets"
                                                          onChange={filterWorkloadsItems}
                                            />
                                        </InputGroup>
                                        <div style={{height: '300px', overflow: 'auto'}}>
                                            <Nav variant="pills" className="flex-column">
                                                {state.workloads.daemonSets.list?.map((item) =>
                                                    <Nav.Item key={item.id}>
                                                        <Nav.Link eventKey={item.id}>
                                                            <OverlayTrigger
                                                                placement="right"
                                                                overlay={
                                                                    <Tooltip>
                                                                        {item.condition.message}
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <Badge bg={item.condition.ok ? "success" : "danger"}>
                                                                    {item.condition.ok ? '✔️' : 'X'}
                                                                </Badge>
                                                            </OverlayTrigger>
                                                            &nbsp; {item.name}
                                                        </Nav.Link>
                                                    </Nav.Item>
                                                )}
                                            </Nav>
                                        </div>
                                    </Col>
                                    <Col sm={9}>
                                        <Tab.Content>
                                            {state.workloads.daemonSets.list?.map((item) => (
                                                <Tab.Pane eventKey={item.id} key={item.id}>
                                                    <Table striped bordered hover>
                                                        <thead>
                                                        <tr>
                                                            <th>Labels</th>
                                                            <th>Desired</th>
                                                            <th>Current</th>
                                                            <th>Ready</th>
                                                            <th>Up-To-Date</th>
                                                            <th>Age</th>
                                                            <th>Selectors</th>
                                                            <th>View</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        <tr>
                                                            <td>
                                                                <ListLabels addFilters={addFilters} selector={false}
                                                                            labels={item.labels}
                                                                            newLine={true}/>
                                                            </td>
                                                            <td>{item.desired_replicas}</td>
                                                            <td>{item.current_replicas}</td>
                                                            <td>{item.ready_replicas}</td>
                                                            <td>{item.up_to_date_replicas}</td>
                                                            <td>{item.age}</td>
                                                            <td>
                                                                <ListLabels labels={item.selectors} selector={true}
                                                                            newLine={true}/>
                                                            </td>
                                                            <td style={{verticalAlign: "middle"}}>
                                                                <Button variant="primary">
                                                                    <EyeFill/>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                        </tbody>
                                                    </Table>
                                                </Tab.Pane>
                                            ))}
                                        </Tab.Content>
                                    </Col>
                                </Row>
                            </Tab.Container>
                        </div>
                    </Tab.Content>
                )}
                {activeWorkloadTab === 'jobs' && (
                    <Tab.Content>
                        <div style={{height: '320px', overflow: "auto"}}>
                            <Tab.Container onSelect={(k) => setState(prevState => ({
                                ...prevState,
                                workloads: {
                                    ...prevState.workloads,
                                    jobs: {
                                        ...prevState.workloads.jobs,
                                        activeKey: k
                                    }
                                }
                            }))}
                                           activeKey={state.workloads.jobs.activeKey}
                                           defaultActiveKey={(state.workloads.jobs.list && state.workloads.jobs.list.length > 0) ? state.workloads.jobs.list[0].id : ''}>
                                <Row>
                                    <Col sm={3}>
                                        <InputGroup className={"m-sm-2"}
                                                    hidden={state.workloads.jobs.originalList.length === 0}>
                                            <InputGroup.Checkbox onChange={setFilterWorkloadsItemsOnlyFailed}
                                                                 aria-label="Checkbox for filtering failed workload"/>
                                            <Form.Control type="text" placeholder="Filter Jobs" aria-label="Filter Jobs"
                                                          onChange={filterWorkloadsItems}
                                            />
                                        </InputGroup>
                                        <div style={{height: '300px', overflow: 'auto'}}>
                                            <Nav variant="pills" className="flex-column">
                                                {state.workloads.jobs.list?.map((item) =>
                                                    <Nav.Item key={item.id}>
                                                        <Nav.Link eventKey={item.id}>
                                                            <OverlayTrigger
                                                                placement="right"
                                                                overlay={
                                                                    <Tooltip>
                                                                        {item.condition.message}
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <Badge bg={item.condition.ok ? "success" : "danger"}>
                                                                    {item.condition.ok ? '✔️' : 'X'}
                                                                </Badge>
                                                            </OverlayTrigger>
                                                            &nbsp; {item.name}
                                                        </Nav.Link>
                                                    </Nav.Item>
                                                )}
                                            </Nav>
                                        </div>
                                    </Col>
                                    <Col sm={9}>
                                        <Tab.Content>
                                            {state.workloads.jobs.list?.map((item) => (
                                                <Tab.Pane eventKey={item.id} key={item.id}>
                                                    <Table striped bordered hover>
                                                        <thead>
                                                        <tr>
                                                            <th>Labels</th>
                                                            <th>Completions</th>
                                                            <th>Successful</th>
                                                            <th>Age</th>
                                                            <th>View</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        <tr>
                                                            <td>
                                                                <ListLabels addFilters={addFilters} labels={item.labels}
                                                                            newLine={true}/>
                                                            </td>
                                                            <td>{item.completions}</td>
                                                            <td>{item.successful}</td>
                                                            <td>{item.age}</td>
                                                            <td style={{verticalAlign: "middle"}}>
                                                                <Button variant="primary">
                                                                    <EyeFill/>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                        </tbody>
                                                    </Table>
                                                </Tab.Pane>
                                            ))}
                                        </Tab.Content>
                                    </Col>
                                </Row>
                            </Tab.Container>
                        </div>
                    </Tab.Content>
                )}
                {activeWorkloadTab === 'cronJobs' && (
                    <Tab.Content>
                        <div style={{height: '320px', overflow: "auto"}}>
                            <Tab.Container onSelect={(k) => setState(prevState => ({
                                ...prevState,
                                workloads: {
                                    ...prevState.workloads,
                                    cronJobs: {
                                        ...prevState.workloads.cronJobs,
                                        activeKey: k
                                    }
                                }
                            }))}
                                           activeKey={state.workloads.cronJobs.activeKey}
                                           defaultActiveKey={(state.workloads.cronJobs.list && state.workloads.cronJobs.list.length > 0) ? state.workloads.cronJobs.list[0].id : ''}>
                                <Row>
                                    <Col sm={3}>
                                        <InputGroup className={"m-sm-2"}
                                                    hidden={state.workloads.cronJobs.originalList.length === 0}>
                                            <InputGroup.Checkbox onChange={setFilterWorkloadsItemsOnlyFailed}
                                                                 aria-label="Checkbox for filtering failed workload"/>
                                            <Form.Control type="text" placeholder="Filter Cron Jobs"
                                                          aria-label="Filter Cron Jobs"
                                                          onChange={filterWorkloadsItems}
                                            />
                                        </InputGroup>
                                        <div style={{height: '300px', overflow: 'auto'}}>
                                            <Nav variant="pills" className="flex-column">
                                                {state.workloads.cronJobs.list?.map((item) =>
                                                    <Nav.Item key={item.id}>
                                                        <Nav.Link eventKey={item.id}>
                                                            {item.name}
                                                        </Nav.Link>
                                                    </Nav.Item>
                                                )}
                                            </Nav>
                                        </div>
                                    </Col>
                                    <Col sm={9}>
                                        <Tab.Content>
                                            {state.workloads.cronJobs.list?.map((item) => (
                                                <Tab.Pane eventKey={item.id} key={item.id}>
                                                    <Table striped bordered hover>
                                                        <thead>
                                                        <tr>
                                                            <th>Labels</th>
                                                            <th>Schedule</th>
                                                            <th>Age</th>
                                                            <th>View</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        <tr>
                                                            <td>
                                                                <ListLabels addFilters={addFilters} labels={item.labels}
                                                                            newLine={true}/>
                                                            </td>
                                                            <td>{item.schedule}</td>
                                                            <td>{item.age}</td>
                                                            <td style={{verticalAlign: "middle"}}>
                                                                <Button variant="primary">
                                                                    <EyeFill/>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                        </tbody>
                                                    </Table>
                                                </Tab.Pane>
                                            ))}
                                        </Tab.Content>
                                    </Col>
                                </Row>
                            </Tab.Container>
                        </div>
                    </Tab.Content>
                )}
                {activeWorkloadTab === 'pods' && (
                    <Tab.Content>
                        <div style={{height: '320px', overflow: "auto"}}>
                            <Tab.Container onSelect={(k) => setState(prevState => ({
                                ...prevState,
                                workloads: {
                                    ...prevState.workloads,
                                    pods: {
                                        ...prevState.workloads.pods,
                                        activeKey: k
                                    }
                                }
                            }))}
                                           activeKey={state.workloads.pods.activeKey}
                                           defaultActiveKey={(state.workloads.pods.list && state.workloads.pods.list.length > 0) ? state.workloads.pods.list[0].id : ''}>
                                <Row>
                                    <Col sm={3}>
                                        <InputGroup className={"m-sm-2"}
                                                    hidden={state.workloads.pods.originalList.length === 0}>
                                            <InputGroup.Checkbox onChange={setFilterWorkloadsItemsOnlyFailed}
                                                                 aria-label="Checkbox for filtering failed workload"/>
                                            <Form.Control type="text" placeholder="Filter Pods" aria-label="Filter Pods"
                                                          onChange={filterWorkloadsItems}
                                            />
                                        </InputGroup>
                                        <div style={{height: '300px', overflow: 'auto'}}>
                                            <Nav variant="pills" className="flex-column">
                                                {state.workloads.pods.list?.map((item) =>
                                                    <Nav.Item key={item.id}>
                                                        <Nav.Link eventKey={item.id}>
                                                            <OverlayTrigger
                                                                placement="right"
                                                                overlay={
                                                                    <Tooltip>
                                                                        {item.condition.message}
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <Badge bg={item.condition.ok ? "success" : "danger"}>
                                                                    {item.condition.ok ? '✔️' : 'X'}
                                                                </Badge>
                                                            </OverlayTrigger>
                                                            &nbsp; {item.name}
                                                        </Nav.Link>
                                                    </Nav.Item>
                                                )}
                                            </Nav>
                                        </div>
                                    </Col>
                                    <Col sm={9}>
                                        <Tab.Content>
                                            {state.workloads.pods.list?.map((item) => (
                                                <Tab.Pane eventKey={item.id} key={item.id}>
                                                    <Table striped bordered hover>
                                                        <thead>
                                                        <tr>
                                                            <th>Labels</th>
                                                            <th>Ready</th>
                                                            <th>Phase</th>
                                                            <th>Status</th>
                                                            <th>Restarts</th>
                                                            <th>Node</th>
                                                            <th>Age</th>
                                                            <th>View</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        <tr>
                                                            <td>
                                                                <ListLabels addFilters={addFilters} labels={item.labels}
                                                                            newLine={true}/>
                                                            </td>
                                                            <td>{item.ready_actual}/{item.ready_desired}</td>
                                                            <td>{item.phase}</td>
                                                            <td>{item.status}</td>
                                                            <td>{item.restarts}</td>
                                                            <td>{item.node}</td>
                                                            <td>{item.age}</td>
                                                            <td style={{verticalAlign: "middle"}}>
                                                                <Button variant="primary">
                                                                    <EyeFill/>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                        </tbody>
                                                    </Table>
                                                </Tab.Pane>
                                            ))}
                                        </Tab.Content>
                                    </Col>
                                </Row>
                            </Tab.Container>
                        </div>
                    </Tab.Content>
                )}
                {activeWorkloadTab === 'replicaSets' && (
                    <Tab.Content>
                        <div style={{height: '320px', overflow: "auto"}}>
                            <Tab.Container onSelect={(k) => setState(prevState => ({
                                ...prevState,
                                workloads: {
                                    ...prevState.workloads,
                                    replicaSets: {
                                        ...prevState.workloads.replicaSets,
                                        activeKey: k
                                    }
                                }
                            }))}
                                           activeKey={state.workloads.replicaSets.activeKey}
                                           defaultActiveKey={(state.workloads.replicaSets.list && state.workloads.replicaSets.list.length > 0) ? state.workloads.replicaSets.list[0].id : ''}>
                                <Row>
                                    <Col sm={3}>
                                        <InputGroup className={"m-sm-2"}
                                                    hidden={state.workloads.replicaSets.originalList.length === 0}>
                                            <InputGroup.Checkbox onChange={setFilterWorkloadsItemsOnlyFailed}
                                                                 aria-label="Checkbox for filtering failed workload"/>
                                            <Form.Control type="text" placeholder="Filter Replica Sets"
                                                          aria-label="Filter Replica Sets"
                                                          onChange={filterWorkloadsItems}
                                            />
                                        </InputGroup>
                                        <div style={{height: '300px', overflow: 'auto'}}>
                                            <Nav variant="pills" className="flex-column">
                                                {state.workloads.replicaSets.list?.map((item) =>
                                                    <Nav.Item key={item.id}>
                                                        <Nav.Link eventKey={item.id}>
                                                            <OverlayTrigger
                                                                placement="right"
                                                                overlay={
                                                                    <Tooltip>
                                                                        {item.condition.message}
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <Badge bg={item.condition.ok ? "success" : "danger"}>
                                                                    {item.condition.ok ? '✔️' : 'X'}
                                                                </Badge>
                                                            </OverlayTrigger>
                                                            &nbsp; {item.name}
                                                        </Nav.Link>
                                                    </Nav.Item>
                                                )}
                                            </Nav>
                                        </div>
                                    </Col>
                                    <Col sm={9}>
                                        <Tab.Content>
                                            {state.workloads.replicaSets.list?.map((item) => (
                                                <Tab.Pane eventKey={item.id} key={item.id}>
                                                    <Table striped bordered hover>
                                                        <thead>
                                                        <tr>
                                                            <th>Labels</th>
                                                            <th>Status</th>
                                                            <th>Age</th>
                                                            <th>Containers</th>
                                                            <th>Selectors</th>
                                                            <th>View</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        <tr>
                                                            <td>
                                                                <ListLabels addFilters={addFilters} selector={false}
                                                                            labels={item.labels}
                                                                            newLine={true}/>
                                                            </td>
                                                            <td>{item.ready_actual}/{item.ready_desired}</td>
                                                            <td>{item.age}</td>
                                                            <td>
                                                                {item.containers?.map((i, idx) => (
                                                                    <div key={idx}>
                                                                        {i}
                                                                    </div>
                                                                ))}
                                                            </td>
                                                            <td>
                                                                <ListLabels labels={item.selectors} selector={true}
                                                                            newLine={true}/>
                                                            </td>
                                                            <td style={{verticalAlign: "middle"}}>
                                                                <Button variant="primary">
                                                                    <EyeFill/>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                        </tbody>
                                                    </Table>
                                                </Tab.Pane>
                                            ))}
                                        </Tab.Content>
                                    </Col>
                                </Row>
                            </Tab.Container>
                        </div>
                    </Tab.Content>
                )}
                {activeWorkloadTab === 'replicaControllers' && (
                    <Tab.Content>
                        <div style={{height: '320px', overflow: "auto"}}>
                            <Tab.Container onSelect={(k) => setState(prevState => ({
                                ...prevState,
                                workloads: {
                                    ...prevState.workloads,
                                    replicaControllers: {
                                        ...prevState.workloads.replicaControllers,
                                        activeKey: k
                                    }
                                }
                            }))}
                                           activeKey={state.workloads.replicaControllers.activeKey}
                                           defaultActiveKey={(state.workloads.replicaControllers.list && state.workloads.replicaControllers.list.length > 0) ? state.workloads.replicaControllers.list[0].id : ''}>
                                <Row>
                                    <Col sm={3}>
                                        <InputGroup className={"m-sm-2"}
                                                    hidden={state.workloads.replicaControllers.originalList.length === 0}>
                                            <InputGroup.Checkbox onChange={setFilterWorkloadsItemsOnlyFailed}
                                                                 aria-label="Checkbox for filtering failed workload"/>
                                            <Form.Control type="text" placeholder="Filter Replica Controllers"
                                                          aria-label="Filter Replica Controllers"
                                                          onChange={filterWorkloadsItems}
                                            />
                                        </InputGroup>
                                        <div style={{height: '300px', overflow: 'auto'}}>
                                            <Nav variant="pills" className="flex-column">
                                                {state.workloads.replicaControllers.list?.map((item) =>
                                                    <Nav.Item key={item.id}>
                                                        <Nav.Link eventKey={item.id}>
                                                            <OverlayTrigger
                                                                placement="right"
                                                                overlay={
                                                                    <Tooltip>
                                                                        {item.condition.message}
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <Badge bg={item.condition.ok ? "success" : "danger"}>
                                                                    {item.condition.ok ? '✔️' : 'X'}
                                                                </Badge>
                                                            </OverlayTrigger>
                                                            &nbsp; {item.name}
                                                        </Nav.Link>
                                                    </Nav.Item>
                                                )}
                                            </Nav>
                                        </div>
                                    </Col>
                                    <Col sm={9}>
                                        <Tab.Content>
                                            {state.workloads.replicaControllers.list?.map((item) => (
                                                <Tab.Pane eventKey={item.id} key={item.id}>
                                                    <Table striped bordered hover>
                                                        <thead>
                                                        <tr>
                                                            <th>Labels</th>
                                                            <th>Status</th>
                                                            <th>Age</th>
                                                            <th>Containers</th>
                                                            <th>Selectors</th>
                                                            <th>View</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        <tr>
                                                            <td>
                                                                <ListLabels addFilters={addFilters} selector={false}
                                                                            labels={item.labels}
                                                                            newLine={true}/>
                                                            </td>
                                                            <td>{item.ready_actual}/{item.ready_desired}</td>
                                                            <td>{item.age}</td>
                                                            <td>
                                                                {item.containers?.map((i, idx) => (
                                                                    <div key={idx}>
                                                                        {i}
                                                                    </div>
                                                                ))}
                                                            </td>
                                                            <td>
                                                                <ListLabels labels={item.selectors} selector={true}
                                                                            newLine={true}/>
                                                            </td>
                                                            <td style={{verticalAlign: "middle"}}>
                                                                <Button variant="primary">
                                                                    <EyeFill/>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                        </tbody>
                                                    </Table>
                                                </Tab.Pane>
                                            ))}
                                        </Tab.Content>
                                    </Col>
                                </Row>
                            </Tab.Container>
                        </div>
                    </Tab.Content>
                )}
            </Card>
            <DeploymentOverview show={state.workloads.deployments.showOverview} close={() => {
                setState(prevState => ({
                    ...prevState,
                    workloads: {
                        ...prevState.workloads,
                        deployments: {
                            ...prevState.workloads.deployments,
                            showOverview: false
                        }
                    }
                }))
            }
            } addFilters={addFilters} configID={state.selectedConfigID}
                                deploymentName={state.workloads.deployments.current}
                                ns={state.selectedNamespace} cluster={state.selectedClusterName}
                                setTerminalControllerShow={setTerminalControllerShow}
                                setTerminalControllerShowMinimized={setTerminalControllerShowMinimized}/>
            <TerminalController terminalControllerShow={terminalControllerShow}
                                setTerminalControllerShow={setTerminalControllerShow}
                                terminalControllerShowMinimized={terminalControllerShowMinimized}
                                setTerminalControllerShowMinimized={setTerminalControllerShowMinimized}></TerminalController>
        </>
    )
}

export default HomePageStandardMode;