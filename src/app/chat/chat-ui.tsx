"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Input,
  Button,
  Image,
  Field,
  NativeSelect,
  Slider,
  Textarea,
} from "@chakra-ui/react";
import api from "../../service/api";

interface Message {
  id: number;
  text: string;
  role: "user" | "bot";
}

interface Agent {
  id: string;
  name: string;
  basePrompt: string;
  temperature: number;
}

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [basePrompt, setBasePrompt] = useState<string>("");
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Agent[]>("/agents");
        setAgents(res.data || []);
        if (res.data?.length) {
          const first = res.data[0];
          setSelectedAgentId(first.id);
          setTemperature(first.temperature ?? 0.7);
          setBasePrompt(first.basePrompt ?? "");
        }
      } catch (e) {
        console.error("Erro ao buscar agentes:", e);
      }
    })();
  }, []);
  useEffect(() => {
    if (!selectedAgentId) return;
    const agent = agents.find((a) => a.id === selectedAgentId);
    if (agent) {
      setTemperature(agent.temperature ?? 0.7);
      setBasePrompt(agent.basePrompt ?? "");
    }
  }, [selectedAgentId, agents]);

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId),
    [agents, selectedAgentId]
  );

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !selectedAgentId) return;

    const userMessage: Message = { id: Date.now(), text: input, role: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await api.post("/chats/ask", {
        question: userMessage.text,
        agentId: selectedAgentId,
      });
      console.log("Resposta do servidor:", res.status, res.data);
      const text =
        typeof res.data === "string"
          ? res.data
          : res.data?.response ?? JSON.stringify(res.data);

      const botMessage: Message = {
        id: Date.now() + 1,
        text,
        role: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          text: "Erro ao enviar mensagem. Verifique o servidor.",
          role: "bot",
        },
      ]);
    }
  }

  async function saveAgentSettings() {
    if (!selectedAgentId) return;
    try {
      const res = await api.patch(`/agents/${selectedAgentId}`, {
        temperature,
        basePrompt,
      });
      setAgents((prev) =>
        prev.map((a) =>
          a.id === selectedAgentId ? { ...a, temperature, basePrompt } : a
        )
      );

      setShowSettings(false);
    } catch (e) {
      console.error("Erro ao salvar configurações do agente:", e);
    }
  }

  return (
    <Box position="relative" h="100vh" display="flex" flexDirection="column">
      <Box
        position="absolute"
        top="16px"
        right="16px"
        display="flex"
        gap={3}
        alignItems="center"
      >
        <Field.Root>
          <Field.Label display="none">Agente</Field.Label>
          <NativeSelect.Root size="sm" width="220px">
            <NativeSelect.Field
              as="select"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              style={{ backgroundColor: "white" }}
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>
        <Button
          variant="ghost"
          borderRadius="full"
          p={0}
          onClick={() => setShowSettings(true)}
        >
          <Image
            src="https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740&q=80"
            alt="Usuário"
            boxSize="40px"
            borderRadius="full"
          />
        </Button>
      </Box>
      {showSettings && (
        <Box
          position="fixed"
          inset="0"
          bg="blackAlpha.300"
          backdropFilter="blur(4px)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={10}
        >
          <Box bg="white" p={6} borderRadius="lg" w="420px" position="relative">
            <Button
              position="absolute"
              top="8px"
              right="8px"
              variant="ghost"
              onClick={() => setShowSettings(false)}
            >
              ✕
            </Button>
            <Box as="h2" fontSize="lg" fontWeight="bold" mb={4}>
              Configurações do Agente
            </Box>
            <Field.Root mb={4}>
              <Field.Label>Agente</Field.Label>
              <NativeSelect.Root size="sm" width="100%">
                <NativeSelect.Field
                  as="select"
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  style={{ backgroundColor: "white" }}
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>
            <Box mb={4}>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Box>Temperatura</Box>
                <Box fontWeight="semibold">{temperature.toFixed(1)}</Box>
              </Box>
              <Slider.Root
                width="100%"
                min={0}
                max={2}
                step={0.1}
                value={[temperature]}
                onValueChange={(detail: { value: number[] }) =>
                  setTemperature(detail.value[0])
                }
              >
                <Slider.Control>
                  <Slider.Track>
                    <Slider.Range />
                  </Slider.Track>
                  <Slider.Thumbs />
                </Slider.Control>
              </Slider.Root>
            </Box>
            <Field.Root mb={4}>
              <Field.Label>Base Prompt</Field.Label>
              <Textarea
                value={basePrompt}
                onChange={(e) => setBasePrompt(e.target.value)}
                rows={6}
                placeholder="Defina o comportamento do agente..."
              />
            </Field.Root>
            <Button colorScheme="blue" w="full" onClick={saveAgentSettings}>
              Salvar
            </Button>
          </Box>
        </Box>
      )}
      <Box
        flex="1"
        overflowY="auto"
        p={4}
        display="flex"
        flexDirection="column"
        gap={2}
        mb="72px"
        w="100%"
        maxW="800px"
        mx="auto"
      >
        {messages.map((msg) => (
          <Box
            key={msg.id}
            maxW="75%"
            px={4}
            py={2}
            borderRadius="lg"
            alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
            bg={msg.role === "user" ? "blue.500" : "gray.200"}
            color={msg.role === "user" ? "white" : "black"}
            whiteSpace="pre-wrap"
          >
            {msg.text}
          </Box>
        ))}
      </Box>
      <Box
        as="form"
        onSubmit={sendMessage}
        position="fixed"
        bottom="0"
        left="50%"
        transform="translateX(-50%)"
        w="100%"
        maxW="800px"
        p={4}
        bg="white"
        display="flex"
        gap={2}
      >
        <Input
          placeholder={`Digite sua pergunta... (${
            selectedAgent?.name ?? "Selecione um agente"
          })`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          flex="1"
        />
        <Button colorScheme="blue" type="submit" disabled={!selectedAgentId}>
          Enviar
        </Button>
      </Box>
    </Box>
  );
}
