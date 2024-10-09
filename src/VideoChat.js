import React, { useRef, useState, useEffect } from 'react';
import io from 'socket.io-client';

const VideoChat = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [socket, setSocket] = useState(null);

  const mediaConstraints = {
    video: true,
    audio: true,
  };

  const servers = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
    ],
  };

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('https://socketservervideochat.onrender.com');
    setSocket(newSocket);

    newSocket.on('offer', handleReceiveOffer);
    newSocket.on('answer', handleReceiveAnswer);
    newSocket.on('ice-candidate', handleNewICECandidate);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Get local media stream
  const startLocalStream = async () => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      localVideoRef.current.srcObject = localStream;
    } catch (err) {
      console.error('Error accessing local media', err);
    }
  };

  // Create and send an offer
  const initiateCall = async () => {
    const pc = new RTCPeerConnection(servers);
    setPeerConnection(pc);

    const localStream = localVideoRef.current.srcObject;
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    const localOffer = await pc.createOffer();
    await pc.setLocalDescription(localOffer);
    socket.emit('offer', localOffer); // Send offer to the signaling server

    console.log('Offer created and sent');
  };

  // Handle the received offer
  const handleReceiveOffer = async (offer) => {
    const pc = new RTCPeerConnection(servers);
    setPeerConnection(pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    const localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    localVideoRef.current.srcObject = localStream;

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const localAnswer = await pc.createAnswer();
    await pc.setLocalDescription(localAnswer);
    socket.emit('answer', localAnswer); // Send answer to the signaling server

    console.log('Answer created and sent');
  };

  // Handle the received answer
  const handleReceiveAnswer = async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log('Answer received and set as remote description');
  };

  // Handle new ICE candidates
  const handleNewICECandidate = async (candidate) => {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('ICE candidate added');
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  return (
    <div>
      <h2>WebRTC Video Chat</h2>
      <div>
        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '300px', marginRight: '20px' }}></video>
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px' }}></video>
      </div>

      <button onClick={startLocalStream}>Start Local Stream</button>
      <button onClick={initiateCall}>Initiate Call</button>
    </div>
  );
};

export default VideoChat;
