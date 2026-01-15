import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import HmacSHA256 from "crypto-js/hmac-sha256";
import Base64 from "crypto-js/enc-base64";
import AppText from "../AppText";
import { colors } from "../../theme";

const b64urlToB64 = (value) => {
  const str = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  return str + (pad === 0 ? "" : "=".repeat(4 - pad));
};

const b64ToB64url = (value) =>
  String(value || "").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const RollingQr = ({ ticketId, apiBase, size = 160, style, debug = false }) => {
  const [seed, setSeed] = useState(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const intervalRef = useRef(null);
  const refreshRef = useRef(null);

  const fetchSession = async () => {
    if (!ticketId || !apiBase) return;
    try {
      setError("");
      const res = await fetch(`${apiBase}/api/ticket/qr/ticket/${ticketId}.session`);
      if (res.status === 409) {
        setError("outside dynamic window");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const now = Number(data?.now || Math.floor(Date.now() / 1000));
      const stepSeconds = Number(data?.stepSeconds || 60);
      const ttl = Number(data?.sessionTtlSeconds || 600);
      const expiresAt = now + ttl;
      const clientKeyRaw = String(data?.clientKey || "");
      const envelope = String(data?.envelope || "");
      if (!clientKeyRaw || !envelope) throw new Error("invalid session");
      const key = Base64.parse(b64urlToB64(clientKeyRaw));
      setSeed({ envelope, key, stepSeconds, expiresAt });
    } catch (err) {
      setError(err?.message || "qr session error");
    }
  };

  useEffect(() => {
    setSeed(null);
    setToken("");
    if (!ticketId) return undefined;
    fetchSession();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (refreshRef.current) clearTimeout(refreshRef.current);
    };
  }, [ticketId, apiBase]);

  useEffect(() => {
    if (!seed) return undefined;
    const nowSec = Math.floor(Date.now() / 1000);
    const msLeft = Math.max(seed.expiresAt - nowSec, 1) * 1000;
    refreshRef.current = setTimeout(() => {
      setSeed(null);
      setToken("");
      fetchSession();
    }, msLeft);

    const update = () => {
      try {
        const now = Math.floor(Date.now() / 1000);
        const m = Math.floor(now / seed.stepSeconds);
        const signInput = `${seed.envelope}.${m}`;
        const sig = HmacSHA256(signInput, seed.key);
        const b64 = Base64.stringify(sig);
        const sigUrl = b64ToB64url(b64);
        setToken(`v3.${seed.envelope}.${m}.${sigUrl}`);
      } catch (err) {
        setError(err?.message || "qr sign error");
      }
    };

    update();
    intervalRef.current = setInterval(update, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [seed]);

  const containerStyle = [styles.container, { width: size, height: size }, style];

  if (error) {
    return (
      <View style={containerStyle}>
        <AppText style={styles.placeholderText}>QR no disponible</AppText>
      </View>
    );
  }

  if (!token) {
    return (
      <View style={containerStyle}>
        <AppText style={styles.placeholderText}>Generando QR...</AppText>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <QRCode value={token} size={size} color="#000000" backgroundColor="#ffffff" quietZone={6} />
      {debug ? <AppText style={styles.debugText}>v3 rolling</AppText> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    backgroundColor: "#F6F8FA",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 11,
    color: colors.muted,
    textAlign: "center",
  },
  debugText: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 6,
  },
});

export default RollingQr;
