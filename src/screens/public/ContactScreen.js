import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import AppText from "../../components/AppText";
import { colors, spacing } from "../../theme";
import { sendMessageApi } from "../../services/api";

const ContactScreen = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const onSubmit = async () => {
    setStatus("");
    try {
      await sendMessageApi({ name, email, message });
      setStatus("Mensaje enviado.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus("No se pudo enviar el mensaje.");
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.card}>
        <AppText weight="bold" style={styles.title}>
          Contactanos
        </AppText>
        <Input placeholder="Nombre" value={name} onChangeText={setName} />
        <Input placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input placeholder="Mensaje" value={message} onChangeText={setMessage} multiline style={styles.textArea} />
        {status ? <AppText style={styles.status}>{status}</AppText> : null}
        <Button title="Enviar" onPress={onSubmit} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  title: {
    fontSize: 18,
  },
  textArea: {
    minHeight: 120,
  },
  status: {
    color: colors.brand,
  },
});

export default ContactScreen;
