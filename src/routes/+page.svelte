<script lang="ts">
  import { onMount } from "svelte";

  let localVideo: HTMLVideoElement;
  let remoteVideo: HTMLVideoElement;
  let localStream: MediaStream;

  onMount(async () => {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideo.srcObject = localStream;
      localVideo.muted = true;
      await createPeerConnection();
    } catch (err) {
      console.error("Error accessing media devices.", err);
    }
  });

  // WebRTC connection setup and handling
  let peerConnection: RTCPeerConnection;
  const configuration: RTCConfiguration = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  async function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("sending ice candidate", event.candidate);
        // Send the candidate to the remote peer
      }
    };

    peerConnection.ontrack = (event) => {
      remoteVideo.srcObject = event.streams[0];
    };

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send the offer to the remote peer
    } catch (err) {
      console.error("Error creating peer connection.", err);
    }
  }
</script>

<h1>WebRTC Call</h1>
<video bind:this={localVideo} autoplay playsinline>
  <track kind="captions" />
</video>
<video bind:this={remoteVideo} autoplay playsinline>
  <track kind="captions" />
</video>
<video bind:this={remoteVideo} autoplay playsinline>
  <track kind="captions" />
</video>
