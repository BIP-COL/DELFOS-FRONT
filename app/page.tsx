'use client';
/*eslint-disable*/

import Link from '@/components/link/Link';
import { ChatBody } from '@/types/types';
import { Box, Button, Flex, Input, Text, useColorModeValue, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
export default function Chat() {
  // Input States
  const [inputCode, setInputCode] = useState<string>('');
  const [history, setHistory] = useState<
    Array<{ question: string; formatted: any }>
  >([]);
  // Loading state
  const [loading, setLoading] = useState<boolean>(false);

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

    // Chat post conditions(maximum number of characters, valid message etc.)
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
    setLoading(true);
    const controller = new AbortController();
    const body: ChatBody = {
      inputCode
    };

    // -------------- Fetch --------------
    const response = await fetch('./api/chatAPI', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        inputCode: body.inputCode,   // este es el mensaje del usuario
      }),
    });

    const rawText = await response.text();

    if (!response.ok) {
      setLoading(false);
      alert(rawText || 'Something went wrong fetching from the API.');
      return;
    }

    let data: any;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (err) {
      setLoading(false);
      alert(`Respuesta no es JSON: ${rawText}`);
      return;
    }

    // Prefer top-level formatted_response; fallback to FormatAgent parsed_response
    let formatted = data?.formatted_response;
    if (!formatted && Array.isArray(data?.agent_outputs)) {
      formatted = data.agent_outputs.find(
        (item: any) =>
          item?.agent_name?.toLowerCase() === 'formatagent' &&
          item?.parsed_response,
      )?.parsed_response;
    }
    if (!formatted) {
      alert('No se encontró formatted_response en la respuesta.');
      setLoading(false);
      return;
    }
    setHistory((prev) => [...prev, { question: inputCode, formatted }]);
    setLoading(false);
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
      <Flex
        direction="column"
        flex="1"
        mx="auto"
        w={{ base: '100%', md: '100%', xl: '100%' }}
        maxW="820px"
        pb="0"
        minH="0"
      >
        {/* Main Box */}
        <Flex
          direction="column"
          w="100%"
          mx="auto"
          display={hasHistory ? 'flex' : 'none'}
          mb="8px"
          flex="1"
          minH="0"
          overflowY="auto"
          overflowX="hidden"
          pb={{ base: '80px', md: '64px' }}
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
                  {item.formatted?.link_power_bi && (
                    <Box>
                      <Text fontWeight="700" color={textColor} mb="6px">
                        Power BI
                      </Text>
                      <Link
                        href={item.formatted.link_power_bi}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Text color={brandColor} textDecoration="underline">
                          Ver reporte
                        </Text>
                      </Link>
                    </Box>
                  )}
                </Flex>
              </Box>
            ))}
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
              placeholder="Escribe tu mensaje aquí..."
              onChange={handleChange}
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
    </Flex>
  );
}












