import React, { useRef, useState } from 'react';

const VideoChat = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [offer, setOffer] = useState(null);
  const [answer, setAnswer] = useState(null);

  const mediaConstraints = {
    video: true,
    audio: true,
  };

  const servers = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302', // STUN server to bypass NAT/firewall
      },
    ],
  };

  // Get access to local media stream (video/audio)
  const startLocalStream = async () => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      localVideoRef.current.srcObject = localStream;
    } catch (err) {
      console.error('Error accessing local media', err);
    }
  };

  // Create an offer to start the WebRTC connection
  const initiateCall = async () => {
    const pc = new RTCPeerConnection(servers);
    setPeerConnection(pc);

    const localStream = localVideoRef.current.srcObject;
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE Candidate:', event.candidate);
        // Normally, you send this to the remote peer
      }
    };

    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    const localOffer = await pc.createOffer();
    await pc.setLocalDescription(localOffer);
    setOffer(localOffer); // Save the offer
    console.log('Offer created:', localOffer);
  };

  // Simulate receiving an offer and create an answer
  const handleReceiveOffer = async () => {
    const pc = new RTCPeerConnection(servers);
    setPeerConnection(pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE Candidate received:', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    const localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    localVideoRef.current.srcObject = localStream;
    await pc.setRemoteDescription(new RTCSessionDescription(offer)); // Use the received offer
    const localAnswer = await pc.createAnswer();
    await pc.setLocalDescription(localAnswer);
    setAnswer(localAnswer); // Save the answer
    console.log('Answer created:', localAnswer);
  };

  // Simulate setting the answer for the calling peer
  const handleReceiveAnswer = async () => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log('Answer received and set as remote description');
  };

  return (
    <div>
      <h2>WebRTC Video Chat</h2>
      <div>
        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '300px', marginRight: '20px' }}></video>
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px' }}></video>
      </div>

      <button onClick={startLocalStream}>Start Local Stream</button>
      <button onClick={initiateCall}>Initiate Call (Create Offer)</button>
      <button onClick={handleReceiveOffer}>Receive Offer and Create Answer</button>
      <button onClick={handleReceiveAnswer}>Set Answer on Caller Side</button>

      <div>
        <h4>Offer:</h4>
        <textarea value={offer ? JSON.stringify(offer) : ''} readOnly rows="10" cols="50"></textarea>
      </div>
      <div>
        <h4>Answer:</h4>
        <textarea value={answer ? JSON.stringify(answer) : ''} readOnly rows="10" cols="50"></textarea>
      </div>
    </div>
  );
};

export default VideoChat;
