'use client';
/*eslint-disable*/

import { ChatBody } from '@/types/types';
import { Box, Button, Flex, Input, Text, useColorModeValue, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
export default function Chat() {
  // Input States
  const [inputCode, setInputCode] = useState<string>('');
  const [history, setHistory] = useState<
    Array<{ question: string; formatted: any }>
  >([]);
  const [streamEvents, setStreamEvents] = useState<
    Array<{ step: string; payload: any }>
  >([]);
  // Loading state
  const [loading, setLoading] = useState<boolean>(false);
  // Animated loading text
  const thinkingWords = ['Pensando', 'Analizando', 'Consultando', 'Procesando'];
  const [thinkingIndex, setThinkingIndex] = useState<number>(0);
  const [dots, setDots] = useState<string>('');

  useEffect(() => {
    if (!loading) {
      setThinkingIndex(0);
      setDots('');
      return;
    }
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) {
          // Change word when dots reset
          setThinkingIndex((idx) => (idx + 1) % thinkingWords.length);
          return '';
        }
        return prev + '.';
      });
    }, 400);
    return () => clearInterval(interval);
  }, [loading]);

  // API Key
  // const [apiKey, setApiKey] = useState<string>(apiKeyApp);
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const inputColor = useColorModeValue('navy.700', 'white');
  const brandColor = '#0F4C9B';
  const textColor = useColorModeValue('navy.700', 'white');
  const questionBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const bubbleTailColor = useColorModeValue('#F7FAFC', 'rgba(255,255,255,0.08)');
  const placeholderColor = useColorModeValue(
    { color: 'gray.500' },
    { color: 'whiteAlpha.600' },
  );
  const hasHistory = history.length > 0;
  const handleTranslate = async () => {
    const maxCodeLength = 700;

    if (!inputCode) {
      alert('Please enter your message.');
      return;
    }

    if (inputCode.length > maxCodeLength) {
      alert(
        `Please enter code less than ${maxCodeLength} characters. You are currently at ${inputCode.length} characters.`,
      );
      return;
    }

    const currentMessage = inputCode;
    setHistory((prev) => [...prev, { question: currentMessage, formatted: null }]);
    setInputCode('');
    setStreamEvents([]);
    setLoading(true);

    const controller = new AbortController();
    const streamUrl =
      process.env.NEXT_PUBLIC_BACKEND_STREAM_URL?.trim() ||
      'http://127.0.0.1:8000/api/chat/stream';

    try {
      const payload = {
        message: currentMessage,
        user_id: 'anonymous',
      };
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        const rawText = await response.text();
        setHistory((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].formatted = { error: rawText || 'No se pudo abrir el stream.' };
          return updated;
        });
        setLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalFormatted: any = null;
      const collectedEvents: Array<{ step: string; payload: any }> = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.replace(/^data:\s*/, '');
          try {
            const evt = JSON.parse(jsonStr);
            collectedEvents.push({ step: evt.step, payload: evt });
            setStreamEvents([...collectedEvents]);
            if (evt.step === 'complete' && evt.result) {
              finalFormatted =
                evt.result.formatted_response ||
                evt.result ||
                evt.payload ||
                null;
            }
          } catch (_err) {
            // ignore parse errors
          }
        }
      }

      if (!finalFormatted && collectedEvents.length > 0) {
        const last = collectedEvents[collectedEvents.length - 1].payload;
        finalFormatted =
          last?.result?.formatted_response ||
          last?.result ||
          last?.payload ||
          null;
      }

      if (!finalFormatted) {
        setHistory((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].formatted = { error: 'El stream no devolvió respuesta final.' };
          return updated;
        });
        setLoading(false);
        return;
      }

      setHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].formatted = finalFormatted;
        return updated;
      });
      setLoading(false);
    } catch (error) {
      setHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].formatted = {
          error: error instanceof Error ? error.message : 'Error procesando el stream',
        };
        return updated;
      });
      setLoading(false);
    }
  };

  // -------------- Copy Response --------------
  // const copyToClipboard = (text: string) => {
  //   const el = document.createElement('textarea');
  //   el.value = text;
  //   document.body.appendChild(el);
  //   el.select();
  //   document.execCommand('copy');
  //   document.body.removeChild(el);
  // };

  // *** Initializing apiKey with .env.local value
  // useEffect(() => {
  // ENV file verison
  // const apiKeyENV = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  // if (apiKey === undefined || null) {
  //   setApiKey(apiKeyENV)
  // }
  // }, [])

  const handleChange = (Event: any) => {
    setInputCode(Event.target.value);
  };

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <Flex
      w="100%"
      h="100vh"
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      pt={{ base: '110px', md: '110px' }}
      direction="column"
      overflow="hidden"
    >
      {/* Main scrollable area - full width for scrollbar at edge */}
      <Flex
        direction="column"
        flex="1"
        w="100%"
        minH="0"
        overflowY="auto"
        overflowX="hidden"
        display={hasHistory ? 'flex' : 'none'}
        pb={{ base: '80px', md: '64px' }}
      >
        {/* Content container - centered with max width */}
        <Flex
          direction="column"
          w="100%"
          maxW="820px"
          mx="auto"
          mb="8px"
        >
          <Flex w="100%" direction="column" gap="20px">
            {history.map((item, idx) => (
              <Box
                key={`hist-${idx}`}
                w="100%"
                borderRadius="16px"
                p="6px"
              >
                {/* Pregunta a la derecha, sin iconos */}
                <Flex w="100%" justify="flex-end" mb="12px">
                  <Box
                    maxW="70%"
                    p="16px 20px"
                    borderRadius="14px"
                    border="1px solid"
                    borderColor={borderColor}
                    bg={questionBg}
                    position="relative"
                    _after={{
                      content: "''",
                      position: 'absolute',
                      right: '-12px',
                      top: '18px',
                      width: '0',
                      height: '0',
                      borderTop: '10px solid transparent',
                      borderBottom: '10px solid transparent',
                      borderLeft: `12px solid ${bubbleTailColor}`,
                    }}
                  >
                    <Text
                      color={textColor}
                      fontWeight="700"
                      fontSize={{ base: 'sm', md: 'md' }}
                      lineHeight={{ base: '22px', md: '24px' }}
                    >
                      {item.question}
                    </Text>
                  </Box>
                </Flex>

                {/* Respuesta continua */}
                <Flex w="100%" direction="column" gap="10px">
                  {/* Show loading indicator while waiting for response */}
                  {item.formatted === null && (
                    <Box>
                      <Text color="gray.500" fontStyle="italic">{thinkingWords[thinkingIndex]}{dots}</Text>
                    </Box>
                  )}
                  {/* Show error message if present */}
                  {item.formatted?.error && (
                    <>
                      {/* Show patron and arquetipo info before error, only if not both NA */}
                      {!(item.formatted?.patron === 'NA' && item.formatted?.arquetipo === 'NA') && (
                        <Box>
                          <Text color={textColor}>
                            El patrón identificado es: {item.formatted?.patron || 'N/A'} y la pregunta es de arquetipo {item.formatted?.arquetipo || 'N/A'}
                          </Text>
                        </Box>
                      )}
                      <Box
                        py="4px"
                        px="12px"
                        borderLeft="4px solid"
                        borderColor="red.400"
                      >
                        <Text color="red.700">{item.formatted.error}</Text>
                      </Box>
                    </>
                  )}
                  {/* Only show data table, insight, and Power BI if no error */}
                  {!item.formatted?.error && (
                    <>
                      {Array.isArray(item.formatted?.datos) &&
                        item.formatted.datos.length > 0 && (
                          <Box overflowX="auto">
                            <Table size="sm" variant="simple">
                              <Thead>
                                <Tr>
                                  {Object.keys(item.formatted.datos[0] || {}).map((key) => (
                                    <Th key={key} textTransform="capitalize">
                                      {key}
                                    </Th>
                                  ))}
                                </Tr>
                              </Thead>
                              <Tbody>
                                {item.formatted.datos.map(
                                  (row: Record<string, any>, rowIdx: number) => (
                                    <Tr key={rowIdx}>
                                      {Object.keys(item.formatted.datos[0] || {}).map((key) => (
                                        <Td key={key}>
                                          {typeof row[key] === 'number'
                                            ? row[key].toLocaleString('es-MX')
                                            : String(row[key])}
                                        </Td>
                                      ))}
                                    </Tr>
                                  ),
                                )}
                              </Tbody>
                            </Table>
                          </Box>
                        )}
                      {item.formatted?.insight && (
                        <Box>
                          <Text fontWeight="700" color={textColor} mb="6px">
                            Insight
                          </Text>
                          <Text color={textColor}>{item.formatted.insight}</Text>
                        </Box>
                      )}
                      {item.formatted?.html_url && (
                        <Box>
                          <Text fontWeight="700" color={textColor} mb="6px">
                            Gráfica
                          </Text>
                          <Box
                            as="iframe"
                            src={item.formatted.html_url}
                            width="100%"
                            height="400px"
                            border="none"
                            borderRadius="8px"
                          />
                        </Box>
                      )}
                      {item.formatted?.link_power_bi && (
                        <Box>
                          <Text fontWeight="700" color={textColor} mb="6px">
                            Power BI
                          </Text>
                          <a
                            href={item.formatted.link_power_bi}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Text color={brandColor} textDecoration="underline">
                              Ver reporte
                            </Text>
                          </a>
                        </Box>
                      )}
                    </>
                  )}
                </Flex>
              </Box>
            ))}
          </Flex>
        </Flex>
      </Flex>
      {/* Chat Input */}
      <Flex
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        px={{ base: '12px', md: '24px' }}
          justify="center"
          zIndex="50"
        >
          <Flex
            w="100%"
            maxW="820px"
            bg="white"
            borderRadius="45px"
            boxShadow="0px 18px 30px -12px rgba(15, 76, 155, 0.15)"
            border="1px solid"
            borderColor={borderColor}
            align="center"
            px="10px"
            py="6px"
            gap="10px"
          >
            <Input
              flex="1"
              minH="54px"
              h="100%"
              border="none"
              _focus={{ borderColor: 'none', boxShadow: 'none' }}
              color={inputColor}
              _placeholder={placeholderColor}
              placeholder="Pregunta a Delfos"
              value={inputCode}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleTranslate();
                }
              }}
            />
            <Button
              bg={brandColor}
              color="white"
              py="16px"
              px="20px"
              fontSize="sm"
              borderRadius="40px"
              w={{ base: '120px', md: '160px' }}
              h="50px"
              _hover={{
                boxShadow:
                  '0px 18px 30px -12px rgba(15, 76, 155, 0.45) !important',
                bg: '#0d3f81 !important',
                _disabled: {
                  bg: brandColor,
                },
              }}
              _active={{ bg: '#0b366f' }}
              onClick={handleTranslate}
              isLoading={loading ? true : false}
            >
              Enviar
            </Button>
          </Flex>
        </Flex>

    </Flex>
  );
}














