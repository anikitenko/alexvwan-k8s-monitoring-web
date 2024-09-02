import React, {useState, useEffect, useContext} from 'react';
import axios from 'axios';

import './HomePage.css';
import {Helmet} from "react-helmet";

import HomePageEditMode from "./HomePageEditMode";
import HomePageStandardMode from "./HomePageStandardMode";
import {ErrorHandlingToastContext} from "./ErrorHandlingToastContext";

import Spinner from 'react-bootstrap/Spinner';

const HomePage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const errorHandler = useContext(ErrorHandlingToastContext)

    useEffect(() => {
        axios.get('/isInEditMode')
            .then((response) => {
                setData(response.data);
                setLoading(false);
            })
            .catch((error) => {
                errorHandler.addToast(error.message, 'danger');
                setLoading(false);
            });
    }, []); // Empty array means this effect runs once on component mount

    if (loading) return (
        <div className={"text-center"}>
            <Spinner animation="border" variant="dark" />
        </div>
    );
    if (data || data === false) {
        return (
            <Main data={data} />
        );
    }
};

function Main({data}) {
    const [showManageKubeconfigs, setShowManageKubeconfigs] = useState(false);
    const [editMode, setEditMode] = useState(!!data);

    useEffect(() => {
        if (editMode) {
            setShowManageKubeconfigs(true);
        }
    }, [editMode]);

    return (
        <div>
            <Helmet>
                <title>K8S Monitoring Dashboard</title>
            </Helmet>
            {editMode ? <HomePageEditMode showManageKubeconfigs={showManageKubeconfigs} setShowManageKubeconfigs={setShowManageKubeconfigs} switchToStandardMode={() => setEditMode(false)} /> : <HomePageStandardMode switchToEditMode={() => setEditMode(true)} />}
        </div>
    )
}

export default HomePage;