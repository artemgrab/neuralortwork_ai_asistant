"use client";
import { useEffect, useState } from "react";
import VoiceVisualizer from "./voice-visualizer";

const RealtimeAudioAssistant = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [listening, setIsListening] = useState(false);
  const [connection, setConnection] = useState<RTCPeerConnection | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Функція для перевірки доступу до мікрофону
  const getMicrophoneStream = async () => {
    // Перевірка підтримки getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Мікрофон підключено:", stream);
        return stream;
      } catch (error) {
        console.error("Помилка доступу до мікрофону:", error);
        alert("Будь ласка, дозвольте доступ до мікрофону.");
        return null;
      }
    } else {
      console.error("getUserMedia не підтримується в цьому браузері.");
      alert("Цей браузер не підтримує доступ до мікрофону.");
      return null;
    }
  };

  // Перевірка HTTPS
  const checkHTTPS = () => {
    if (window.location.protocol !== "https:") {
      console.error("Цей сайт повинен бути на HTTPS для доступу до мікрофону.");
      alert("Будь ласка, відкрийте сайт через HTTPS для доступу до мікрофону.");
      return false;
    }
    return true;
  };

  const toggleAssistant = async () => {
    if (isEnabled) {
      // Вимикаємо асистента
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (connection) {
        connection.close();
        setConnection(null);
      }
      setIsEnabled(false);
      setIsListening(false);
    } else {
      // Вмикаємо асистента
      if (!checkHTTPS()) return;

      try {
        const tokenResponse = await fetch("/api/session");
        const data = await tokenResponse.json();
        const EPHEMERAL_KEY = data.client_secret.value;

        const pc = new RTCPeerConnection();
        setConnection(pc);
        const audioE1 = document.createElement("audio");
        audioE1.autoplay = true;

        pc.ontrack = (e) => {
          audioE1.srcObject = e.streams[0];
        };

        const ms = await getMicrophoneStream();
        if (ms) {
          setStream(ms);
          pc.addTrack(ms.getTracks()[0]);

          const dc = pc.createDataChannel("oai-events");
          dc.addEventListener("message", (e) => {
            const response = JSON.parse(e.data);
            if (response.type === "input_audio_buffer.speech_started") {
              setIsListening(true);
            }
            if (response.type === "input_audio_buffer.speech_stopped") {
              setIsListening(false);
            }
          });

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          const baseUrl = "https://api.openai.com/v1/realtime";
          const model = "gpt-4o-realtime-preview-2024-12-17";
          const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/sdp",
              Authorization: `Bearer ${EPHEMERAL_KEY}`,
            },
            body: offer.sdp,
          });
          const answer: RTCSessionDescriptionInit = {
            type: "answer",
            sdp: await sdpResponse.text(),
          };
          await pc.setRemoteDescription(answer);

          console.log("WebRTC connection established");
          setIsEnabled(true);
        }
      } catch (e) {
        console.log(e);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-6">
        <VoiceVisualizer 
          stream={stream} 
          isListening={listening} 
        />
        
        <div className="flex flex-col items-center gap-3">
          <p className="
            text-white 
            text-xs 
            font-medium 
            mt-[120px] 
            bg-[#2B4235] 
            rounded-[20px] 
            px-[18px] 
            py-[5px]
          ">
            Tap to record
          </p>
          <button 
            onClick={toggleAssistant}
            className={`
              p-6 
              rounded-full 
              transition-all 
              duration-300 
              hover:scale-110
            `}
          >
            <img 
              src="/mic-icon.svg" 
              alt="Microphone" 
              className="w-20 h-20 mt-[-8px]"
            />
          </button>
        </div>
      </div>
      
      {isEnabled && (
        <div className="mt-2 text-center">
          <p className="text-white">Статус: {listening ? "Слухаю..." : "Не слухаю"}</p>
        </div>
      )}
    </div>
  );
};

export default RealtimeAudioAssistant;
