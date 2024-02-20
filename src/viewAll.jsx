import React, { useState } from 'react';
import { ethers } from 'ethers';
import './css/View.css';
import { create } from 'ipfs-http-client';
const client = create({
    host: '127.0.0.1',
    port: 5001,
    protocol: 'http',
});
function ViewAllCertificateComponent({ }) {

    const [viewMessage, setViewMessage] = useState({});
    const [fileUrl, setFileUrl] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [certificates, setCertificates] = useState([]); // State for all certificates

    const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
    const API_KEY = process.env.REACT_APP_API_KEY;
    const PRIVATE_KEY = process.env.REACT_APP_PRIVATE_KEY;


    const network = 'maticmum';
    const provider = new ethers.providers.AlchemyProvider(network, API_KEY);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    const contractABI = require('./abis/CertificateNFT.json');
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

    const colors = ['lightblue', 'lightgreen', 'lightyellow', 'lightpink', 'lightgray'];

    const viewAllCertificates = async () => {
        try {

            const certificate = await contract.getAllCertificates();
            if (certificate.error) {
                setViewMessage({ error: certificate.error });
                return;
            }
            setCertificates(certificate);

        const fileUrls = await Promise.all(certificate.map(async (cert, index) => {
            console.log(`Certificate ${index}:`, cert);
            const stream = client.cat(cert.fileCID);
            let data = [];

            for await (const chunk of stream) {
                data.push(chunk);
            }
            // Create a Blob from the data
            const blob = new Blob(data, { type: 'image/jpeg' });
            // Create a URL from the Blob
            const url = URL.createObjectURL(blob);
            return url; // Return the URL
        }));
            setFileUrl(fileUrls);
            console.log('File URL:', fileUrls);
            setShowDetails(true);

        } catch (error) {
            setViewMessage({ error: 'Failed to view certificate' + '-->' + error });
        }
    };

    return (
        <div className="view-all-container">
            {!showDetails && (
                <div>
                    <h1>View All Certificates</h1>
                    <button
                        onClick={viewAllCertificates}
                        style={{
                            backgroundColor: '#4caf50',
                            color: 'white',
                            padding: '10px 15px',
                            border: 'none',
                            borderRadius: '5px',
                            marginBottom: '10px',
                            cursor: 'pointer',
                        }}>
                        View Certificates
                    </button>
                </div>
            )}
            {showDetails && certificates.map((certificate, index) => (
                <div key={index} className="details-all-container" style={{ backgroundColor: colors[index % colors.length] }}>
                    <div className='certificate-details'>
                        <h4>Certificate Details</h4>
                        <p>----------------------------</p>
                        <p>Name: {certificate.name}</p>
                        <p>Roll Number: {certificate.roll}</p>
                        <p>Degree Name: {certificate.degreeName}</p>
                        <p>Subject: {certificate.subject}</p>
                        {/* <p>Issue Timestamp: {certificate.timestamp ? new Date(certificate.timestamp * 1000).toString() : 'N/A'}</p>
                        <p>Expiry: {certificate.expiration ? certificate.expiration.toString() : 'N/A'} days</p> */}
                        {/* <p>Signature: {certificate.signature}</p> */}
                    </div>
                    <div>
                    <img id="image" alt="From IPFS" src={fileUrl[index]} height={480} width={360} />
                    </div>
                </div>
            ))}
            {viewMessage && <p>{viewMessage.error}</p>}
        </div>
    );
}

export default ViewAllCertificateComponent;
