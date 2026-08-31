/* ============================================================
   CIBER QUEST — Banco de missões, perguntas e medalhas
   ------------------------------------------------------------
   Referências: ISO 27001:2022 A.6 · NIST SP 800-50 Rev.1 · ENISA · LGPD
   Situações do cotidiano, sem jargão.
   ============================================================ */

const MISSOES = [
  {
    id: "phishing",
    icone: "🎣",
    titulo: "Alerta Phishing",
    descricao: "Aprenda a identificar e-mails e mensagens que tentam te enganar.",
    tema: "Phishing e engenharia social",
    perguntas: [
      {
        cenario: "Você recebe um e-mail dizendo: \"Sua conta do banco será bloqueada em 24h. Clique aqui para regularizar.\" O e-mail vem de banco-atendimento@seguranca-online.net e tem o logo do seu banco.",
        pergunta: "O que você faz?",
        alternativas: [
          "Clico no link para não perder acesso à conta.",
          "Ignoro o e-mail e abro o app oficial do banco pelo celular para conferir.",
          "Respondo o e-mail pedindo mais informações.",
          "Encaminho para minha família para eles verificarem."
        ],
        correta: 1,
        explicacao: "Bancos nunca pedem para você clicar em links por e-mail para \"regularizar\" contas. Sempre abra o app oficial ou digite o endereço do banco no navegador manualmente. O domínio \"seguranca-online.net\" é um sinal claro de golpe: não é o domínio oficial do banco.",
        referencia: "ISO 27001 A.6.3 — Conscientização em segurança"
      },
      {
        cenario: "Chega uma mensagem no WhatsApp: \"Oi, sou seu filho! Perdi meu celular e estou usando outro número. Pode me passar um Pix urgente de R$ 800? Depois te explico.\"",
        pergunta: "Qual é a atitude correta?",
        alternativas: [
          "Fazer o Pix, é uma emergência.",
          "Ligar imediatamente para o número antigo do seu filho para confirmar.",
          "Perguntar dados pessoais do filho pelo próprio WhatsApp para \"testar\".",
          "Bloquear e não fazer nada."
        ],
        correta: 1,
        explicacao: "Este é o golpe mais comum no Brasil — falso parente pedindo dinheiro. Sempre confirme por outro canal: ligue para o número que você já conhece. Nunca confie apenas na foto de perfil (pode ser copiada). Perguntar pelo próprio WhatsApp não funciona: o golpista pode ter dados que colheu de redes sociais.",
        referencia: "Cartilha CERT.br — Golpes de engenharia social"
      },
      {
        cenario: "Você recebe um SMS: \"Parabéns! Você foi sorteado(a) em nossa promoção. Retire seu prêmio: bit.ly/premio-2026\"",
        pergunta: "Como identificar que é golpe?",
        alternativas: [
          "Você não se inscreveu em promoção nenhuma; links encurtados escondem o destino real.",
          "SMS de promoção é sempre confiável.",
          "Bit.ly é uma empresa de sorteios reconhecida.",
          "Preciso clicar para saber se é golpe."
        ],
        correta: 0,
        explicacao: "Dois sinais clássicos: (1) você não se inscreveu em nada — prêmio sem inscrição é golpe; (2) links encurtados (bit.ly, tinyurl) escondem o endereço real. Nunca clique. Se está em dúvida sobre uma promoção legítima, procure a empresa pelo site oficial.",
        referencia: "ENISA — Awareness Raising Material"
      },
      {
        cenario: "Um e-mail no trabalho, aparentemente do seu chefe, pede: \"Preciso que compre 3 cartões de presente Google Play de R$ 200 e me envie os códigos. Não posso falar agora, estou em reunião.\"",
        pergunta: "O que fazer?",
        alternativas: [
          "Comprar rapidamente para atender ao chefe.",
          "Levantar da mesa e ir falar com o chefe pessoalmente ou ligar direto para ele.",
          "Responder o e-mail pedindo confirmação.",
          "Comprar e guardar a nota para reembolso depois."
        ],
        correta: 1,
        explicacao: "Este é o clássico golpe \"BEC\" (Business Email Compromise) — o criminoso se passa por chefe pedindo compras urgentes de cartões-presente (que não podem ser rastreados nem estornados). Sempre confirme pessoalmente ou por telefone. Responder o e-mail não adianta: o criminoso pode estar controlando a caixa de entrada real.",
        referencia: "NIST SP 800-50 Rev.1 — BEC awareness"
      },
      {
        cenario: "Um site do \"Correios\" pede R$ 4,90 de taxa para liberar sua encomenda parada. O link chegou por SMS.",
        pergunta: "Verdadeiro ou falso?",
        alternativas: [
          "Verdadeiro — os Correios cobram taxas por SMS.",
          "Falso — nenhum órgão público cobra taxa por SMS com link para pagamento.",
          "Verdadeiro se o valor for baixo.",
          "Depende do estado."
        ],
        correta: 1,
        explicacao: "Correios, Receita Federal, Detran e outros órgãos públicos nunca cobram taxas por SMS com link. Se realmente há taxa aduaneira, você resolve no app oficial dos Correios ou no site correios.com.br. O valor baixo (R$ 4,90) é isca psicológica — parece pequeno demais para ser golpe, mas o objetivo é roubar seus dados de cartão.",
        referencia: "Cartilha CERT.br"
      }
    ],
    badge: { icone: "🎣", nome: "Detetive de Phishing" }
  },

  {
    id: "senhas",
    icone: "🔐",
    titulo: "Fortaleza de Senhas",
    descricao: "Descubra como criar e proteger senhas realmente seguras.",
    tema: "Senhas e autenticação em dois fatores",
    perguntas: [
      {
        cenario: "Você precisa criar uma senha para o e-mail principal.",
        pergunta: "Qual dessas é a senha mais segura?",
        alternativas: ["123456", "MeuNome1990", "cavalo-verde-piano-quente-42", "P@ssw0rd!"],
        correta: 2,
        explicacao: "Uma frase de quatro palavras aleatórias é muito mais segura que \"P@ssw0rd!\" — ela tem mais caracteres e é mais fácil de lembrar. Senhas curtas com símbolos (P@ssw0rd!) são as primeiras que os criminosos testam. \"MeuNome1990\" usa dado pessoal, facilmente adivinhado. Regra: comprimento importa mais que complexidade.",
        referencia: "NIST SP 800-63B — Digital Identity Guidelines"
      },
      {
        cenario: "Um site pede que você habilite \"verificação em duas etapas\" (2FA / MFA).",
        pergunta: "Vale a pena? Por quê?",
        alternativas: [
          "Não, é chato demais.",
          "Sim — mesmo que roubem sua senha, o criminoso não consegue entrar sem o segundo código.",
          "Só se o site cobrar por isso.",
          "Só para redes sociais."
        ],
        correta: 1,
        explicacao: "MFA (autenticação em múltiplos fatores) é a defesa mais eficaz contra roubo de conta. Habilite em: e-mail principal, redes sociais, banco, iCloud/Google. Prefira app autenticador (Google Authenticator, Microsoft Authenticator) a SMS — SMS pode ser interceptado por SIM swap.",
        referencia: "ISO 27001 A.8.5 — Autenticação segura"
      },
      {
        cenario: "Você tem 30 contas online (banco, redes, compras, streaming...).",
        pergunta: "Qual é a melhor prática para senhas?",
        alternativas: [
          "Usar a mesma senha em todas para não esquecer.",
          "Anotar em um caderno na gaveta.",
          "Usar um gerenciador de senhas (Bitwarden, 1Password, KeePass).",
          "Salvar em um arquivo .txt na área de trabalho."
        ],
        correta: 2,
        explicacao: "Reutilizar senha é o pior hábito: se um site vaza (e vazam toda semana), o criminoso testa a mesma senha em banco, e-mail, tudo. Um gerenciador de senhas cria e guarda senhas únicas de 20+ caracteres para cada site — você só precisa lembrar uma senha mestra. Bitwarden e KeePass são gratuitos.",
        referencia: "ENISA — Password best practices"
      },
      {
        cenario: "Seu banco te envia por SMS um código de 6 dígitos.",
        pergunta: "Alguém te liga dizendo ser do banco e pede esse código. O que fazer?",
        alternativas: [
          "Passar — é do banco, é seguro.",
          "Passar só o primeiro dígito para \"testar\".",
          "Desligar. Nenhum banco pede código de SMS por telefone.",
          "Perguntar o nome do atendente antes de passar."
        ],
        correta: 2,
        explicacao: "Regra de ouro: nenhum banco, empresa, ou pessoa legítima pede seu código SMS/aplicativo por telefone. Esse código é para VOCÊ digitar no app, nunca para dizer em voz alta. Se pediram, é golpe — desligue e ligue você para o banco no número do cartão.",
        referencia: "Banco Central — Golpes financeiros"
      },
      {
        cenario: "Um site que você usa foi hackeado e vazou senhas dos usuários.",
        pergunta: "Você deveria...",
        alternativas: [
          "Não fazer nada, não me afeta.",
          "Trocar a senha desse site — e de qualquer outro onde você usou a mesma senha.",
          "Trocar só se receber e-mail avisando.",
          "Deletar a conta e criar outra."
        ],
        correta: 1,
        explicacao: "Vazamentos são comuns — o site haveibeenpwned.com permite verificar se seu e-mail apareceu em vazamentos. Ao vazar, criminosos vão testar sua senha em outros serviços (\"credential stuffing\"). Troque em TODOS os lugares onde usou a mesma senha, e habilite MFA onde ainda não tem.",
        referencia: "NIST SP 800-63B"
      }
    ],
    badge: { icone: "🔐", nome: "Mestre das Senhas" }
  },

  {
    id: "redes-sociais",
    icone: "📱",
    titulo: "Vida Digital Exposta",
    descricao: "Entenda como suas informações públicas podem ser usadas contra você.",
    tema: "Privacidade e engenharia social nas redes",
    perguntas: [
      {
        cenario: "Você posta uma foto \"finalmente de férias!\" com a marcação do hotel na praia.",
        pergunta: "Qual o risco?",
        alternativas: [
          "Nenhum, é só uma foto.",
          "Um criminoso sabe que sua casa está vazia e pode agir.",
          "Só é problema se for foto ruim.",
          "Só afeta pessoas famosas."
        ],
        correta: 1,
        explicacao: "Postar viagens em tempo real informa criminosos que sua residência está vazia. Boa prática: publique fotos DEPOIS de voltar, ou compartilhe só com amigos próximos em stories restritos. Além disso, marcação de local em fotos ajuda golpistas a mapear sua rotina.",
        referencia: "ENISA — Privacy risks in social media"
      },
      {
        cenario: "Você faz aniversário e coloca ano de nascimento completo no perfil público.",
        pergunta: "Que problema isso gera?",
        alternativas: [
          "Nenhum.",
          "Data de nascimento + nome + cidade permite falsificar identidade.",
          "Só é problema se for menor de idade.",
          "Facilita ganhar mais parabéns."
        ],
        correta: 1,
        explicacao: "Data de nascimento é um dos dados mais valiosos para golpistas — junto com nome e cidade natal, permite abrir conta bancária falsa, obter empréstimos ou responder perguntas de segurança (\"nome do primeiro pet\", \"cidade onde nasceu\"). Deixe apenas dia/mês, ou esconda completamente.",
        referencia: "LGPD Art. 5º — Dado pessoal"
      },
      {
        cenario: "Um estranho no LinkedIn te adiciona dizendo \"vi seu perfil, tenho uma oportunidade\".",
        pergunta: "O que você faz?",
        alternativas: [
          "Aceito e mando meu CV.",
          "Aceito e converso normalmente.",
          "Verifico o perfil: quantos anos tem, tem conexões reais, o texto faz sentido, empresa existe.",
          "Rejeito automaticamente."
        ],
        correta: 2,
        explicacao: "LinkedIn é o novo terreno favorito de golpistas — perfis falsos oferecem \"oportunidades de emprego\" para colher CPF, endereço, salário. Sinais de perfil falso: foto que parece de banco de imagens, criado há pouco tempo, sem conexões brasileiras, texto genérico. Confirme a empresa pelo site oficial dela, não pelo link do perfil.",
        referencia: "NIST SP 800-50 Rev.1 — Social engineering"
      },
      {
        cenario: "Um teste viral aparece: \"Descubra que personagem de Disney você é! Cole seu nome, ano de nascimento e nome da mãe.\"",
        pergunta: "Fazer o teste?",
        alternativas: [
          "Sim, é só brincadeira.",
          "Sim, se muitos amigos fizeram.",
          "Não — esses dados são exatamente os que bancos pedem para confirmar identidade.",
          "Só se for aplicativo oficial da Disney."
        ],
        correta: 2,
        explicacao: "Testes virais coletam dados de segurança em massa. Nome da mãe é resposta padrão de \"pergunta de segurança\" em bancos e cartórios. Nome do primeiro pet, escola, cidade onde nasceu — tudo isso alimenta bases de dados criminosas usadas em fraudes anos depois.",
        referencia: "ENISA — Data harvesting on social media"
      }
    ],
    badge: { icone: "📱", nome: "Cidadão Digital Consciente" }
  },

  {
    id: "wifi",
    icone: "📶",
    titulo: "Redes Sem Fio Sob Risco",
    descricao: "Saiba quando pode e quando não pode confiar em Wi-Fi gratuito.",
    tema: "Wi-Fi público e conexões inseguras",
    perguntas: [
      {
        cenario: "Você está no aeroporto e vê duas redes Wi-Fi disponíveis: \"Aeroporto_WiFi_Gratis\" (sem senha) e \"Aeroporto_Oficial\" (com senha divulgada no painel).",
        pergunta: "Qual conectar?",
        alternativas: [
          "A gratuita, é mais rápido.",
          "A oficial, seguindo as instruções do painel.",
          "As duas, para comparar.",
          "Nenhuma, uso 4G."
        ],
        correta: 1,
        explicacao: "Redes abertas \"copiadas\" (fake AP / evil twin) são um golpe clássico. O criminoso cria uma rede com nome parecido ao do local e captura todo tráfego dos conectados. Sempre prefira a rede oficial com senha divulgada localmente. Se puder usar 4G/5G, ainda melhor — dados móveis são criptografados por padrão.",
        referencia: "ENISA — Public Wi-Fi risks"
      },
      {
        cenario: "Você está em um Wi-Fi público e precisa acessar o app do banco.",
        pergunta: "É seguro?",
        alternativas: [
          "Não, jamais use Wi-Fi público para banco.",
          "Sim, apps de banco usam criptografia própria que protege mesmo em rede aberta.",
          "Só se a rede for do shopping.",
          "Só se estiver com antivírus ativo."
        ],
        correta: 1,
        explicacao: "Apps de banco brasileiros usam certificados e criptografia end-to-end própria — a rede não consegue ver seus dados. O risco real do Wi-Fi público está em: sites HTTP simples (sem cadeado), fake APs, e clicar em avisos falsos de \"instale isso para continuar\". Para navegar em geral, prefira dados móveis ou VPN.",
        referencia: "NIST SP 800-46 — Guide to Enterprise Telework"
      },
      {
        cenario: "Uma rede Wi-Fi grátis exige que você faça \"login com Facebook\" para acessar.",
        pergunta: "Como agir?",
        alternativas: [
          "Faço login, é rápido.",
          "Uso outra rede social qualquer.",
          "Evito — estou dando acesso ao meu perfil por 15 minutos de internet.",
          "Faço login com uma conta secundária."
        ],
        correta: 2,
        explicacao: "Ao \"logar com Facebook\" em Wi-Fi grátis, você autoriza a rede a ler seu perfil, lista de amigos e às vezes postar por você. É pagamento em dados. Se precisar mesmo, use um e-mail cadastral (não o principal) ou pule a rede.",
        referencia: "LGPD Art. 7º — Consentimento"
      },
      {
        cenario: "Você acessa um site pelo navegador e a barra de endereço mostra \"Não seguro\" (sem cadeado).",
        pergunta: "O que isso significa?",
        alternativas: [
          "O site é vírus.",
          "A conexão não é criptografada — qualquer um na mesma rede pode ver o que você digitar.",
          "O site está fora do ar.",
          "É só um aviso do navegador, sem importância."
        ],
        correta: 1,
        explicacao: "\"Não seguro\" significa que o site usa HTTP (não HTTPS). Tudo o que você digitar — usuário, senha, cartão — trafega em texto puro. Nunca digite dados sensíveis em sites sem cadeado. Sites legítimos hoje usam HTTPS por padrão.",
        referencia: "Mozilla Web Docs — HTTPS"
      }
    ],
    badge: { icone: "📶", nome: "Navegante Seguro" }
  },

  {
    id: "malware",
    icone: "🦠",
    titulo: "Anti-Vírus Mental",
    descricao: "Identifique quando um arquivo, aplicativo ou popup é perigoso.",
    tema: "Malware, ransomware e downloads",
    perguntas: [
      {
        cenario: "Um popup aparece: \"SEU COMPUTADOR ESTÁ INFECTADO! Baixe agora nosso antivírus grátis.\"",
        pergunta: "O que fazer?",
        alternativas: [
          "Baixar imediatamente para limpar.",
          "Fechar o popup e ignorar — é falso alarme; o próprio popup é o golpe.",
          "Clicar em \"não\" no popup.",
          "Ligar para o número que aparece."
        ],
        correta: 1,
        explicacao: "Popups de \"vírus detectado\" em navegador NUNCA são reais — seu antivírus não avisa por popup do site, avisa pelo próprio programa. Estes popups instalam o vírus que dizem estar removendo. Feche a aba (Ctrl+W). Se não conseguir, force o encerramento do navegador (Ctrl+Shift+Esc no Windows).",
        referencia: "ENISA — Scareware campaigns"
      },
      {
        cenario: "Você quer baixar um programa (ex: Photoshop, Office) sem pagar. Um site oferece \"crack grátis\".",
        pergunta: "Riscos?",
        alternativas: [
          "Nenhum, é só um programa.",
          "Só o risco de multa.",
          "Cracks são o principal vetor de instalação de trojans, ransomware e roubadores de senha.",
          "É seguro se muita gente já baixou."
        ],
        correta: 2,
        explicacao: "Software pirata é a porta de entrada preferida de malware. O criminoso empacota um programa real com um trojan que rouba senhas do navegador, carteiras de cripto e dados bancários. Alternativas legais gratuitas existem: GIMP (edição de imagem), LibreOffice (documentos), DaVinci Resolve (vídeo).",
        referencia: "NIST SP 800-83 — Malware Incident Prevention"
      },
      {
        cenario: "Um e-mail chega com anexo \"boleto_conta_luz.pdf.exe\" ou \"nota_fiscal.zip\".",
        pergunta: "Abrir?",
        alternativas: [
          "Abro, é boleto.",
          "Abro se conheço o remetente.",
          "Não abro. Extensões .exe, .bat, .scr disfarçadas de PDF são ransomware.",
          "Abro no celular, é mais seguro."
        ],
        correta: 2,
        explicacao: "Arquivos com dupla extensão (.pdf.exe) escondem que são programas executáveis. Um clique e o ransomware criptografa TODOS os seus arquivos. Mesmo conhecendo o remetente, desconfie — a conta dele pode ter sido invadida. Boletos legítimos vêm dentro do e-mail (imagem) ou em PDF real (verificável ao passar mouse sobre o arquivo antes de abrir).",
        referencia: "ISO 27001 A.8.7 — Proteção contra malware"
      },
      {
        cenario: "Seu computador ficou lento e aparecem mensagens \"seus arquivos foram criptografados, pague X bitcoins para recuperar\".",
        pergunta: "Você foi vítima de ransomware. O que fazer?",
        alternativas: [
          "Pagar rapidamente para recuperar.",
          "Desconectar da rede/internet e procurar ajuda técnica; NÃO pagar (não há garantia).",
          "Formatar imediatamente sem fazer nada mais.",
          "Reiniciar várias vezes."
        ],
        correta: 1,
        explicacao: "Pagar é o pior caminho: 20-40% dos que pagam não recebem a chave, e financia mais ataques. Passos: (1) desconecte da internet e da rede (evita que o vírus se espalhe); (2) NÃO desligue — muitos ransomwares mantêm a chave na memória; (3) procure técnico ou site nomoreransom.org (projeto de polícias mundiais que oferece descriptografadores gratuitos para muitas variantes). Backup regular é a única defesa real.",
        referencia: "CISA — Ransomware Guide"
      }
    ],
    badge: { icone: "🦠", nome: "Caçador de Malware" }
  },

  {
    id: "lgpd",
    icone: "⚖️",
    titulo: "Meus Dados, Minhas Regras",
    descricao: "Descubra seus direitos como cidadão sobre seus dados pessoais.",
    tema: "LGPD — Lei Geral de Proteção de Dados",
    perguntas: [
      {
        cenario: "Você vai comprar em uma loja física e a atendente pede seu CPF \"para nota\".",
        pergunta: "Você é obrigado(a) a fornecer?",
        alternativas: [
          "Sim, é lei.",
          "Não — CPF na nota é opcional. Você pode recusar e pedir nota sem CPF.",
          "Sim, se a compra for acima de R$ 100.",
          "Só em farmácias."
        ],
        correta: 1,
        explicacao: "Você não é obrigado a fornecer CPF em compras. Alguns estados oferecem benefícios fiscais (Nota Fiscal Paulista, por exemplo) — nesse caso é opcional. Mas a loja não pode condicionar a venda ao CPF. Se recusarem a nota sem CPF, denuncie no Procon.",
        referencia: "LGPD Art. 6º — Princípios (necessidade)"
      },
      {
        cenario: "Você quer saber quais dados uma empresa (ex: banco, telefonia) tem sobre você.",
        pergunta: "Pela LGPD, o que você pode fazer?",
        alternativas: [
          "Nada — os dados são da empresa.",
          "Pedir acesso, correção ou exclusão dos seus dados; a empresa tem 15 dias para responder.",
          "Só se tiver processo judicial.",
          "Só pagando uma taxa."
        ],
        correta: 1,
        explicacao: "A LGPD (Art. 18) dá ao cidadão direito de: acessar, corrigir, excluir, portar e revogar consentimento. As empresas devem ter um canal para atender (geralmente o DPO — encarregado de dados). Se não responderem, denuncie na ANPD (Autoridade Nacional de Proteção de Dados) em gov.br/anpd.",
        referencia: "LGPD Art. 18 — Direitos do titular"
      },
      {
        cenario: "Um app grátis pede acesso à sua lista de contatos, câmera, microfone, localização — tudo de uma vez.",
        pergunta: "O que considerar?",
        alternativas: [
          "Aceitar todos — sem isso o app não funciona.",
          "Aceitar só os que fazem sentido para o que o app faz.",
          "Aceitar temporariamente e depois revogar.",
          "Nunca aceitar nada."
        ],
        correta: 1,
        explicacao: "Princípio da necessidade: um app de lanterna não precisa da sua lista de contatos. Um app de calculadora não precisa de câmera. Recuse permissões que não fazem sentido. No Android/iOS você pode revisar e revogar permissões nas configurações a qualquer momento. Apps que exigem tudo geralmente vendem seus dados.",
        referencia: "LGPD Art. 6º, IX — Não discriminação"
      },
      {
        cenario: "Um site brasileiro vaza dados de milhões de clientes (CPF, e-mail, endereço).",
        pergunta: "O que a empresa é obrigada a fazer?",
        alternativas: [
          "Nada — vazamentos acontecem.",
          "Comunicar a ANPD e os titulares afetados em prazo razoável, e mitigar o dano.",
          "Só comunicar quem pagar por isso.",
          "Só se pego pela polícia."
        ],
        correta: 1,
        explicacao: "LGPD Art. 48: a empresa é obrigada a comunicar a ANPD e os titulares afetados em prazo razoável. Se não comunicar, pode receber multa de até 2% do faturamento (limitada a R$ 50 milhões por infração). Como titular, você pode processar por dano moral. Verificar seus vazamentos: haveibeenpwned.com.",
        referencia: "LGPD Art. 48 — Comunicação de incidente"
      }
    ],
    badge: { icone: "⚖️", nome: "Guardião de Dados" }
  },

  {
    id: "dispositivos",
    icone: "💻",
    titulo: "Blindando Meus Aparelhos",
    descricao: "Práticas simples para proteger celular, notebook e dados importantes.",
    tema: "Segurança de dispositivos e backup",
    perguntas: [
      {
        cenario: "Você comprou um celular novo. Qual configuração de segurança básica ativar?",
        pergunta: "Prioridade número 1:",
        alternativas: [
          "Só instalar antivírus.",
          "Bloqueio de tela com senha/PIN/biometria + criptografia (já vem ligada nos celulares modernos).",
          "Nenhuma — celular novo já vem seguro.",
          "Só ativar o \"não perturbe\"."
        ],
        correta: 1,
        explicacao: "Bloqueio de tela é a defesa mais básica e mais ignorada. Sem ele, quem pegar seu celular acessa e-mail, apps de banco, WhatsApp — tudo. Use PIN de 6+ dígitos ou biometria (impressão digital, face). \"1234\" ou \"0000\" não conta. Criptografia já vem ativa por padrão em iPhones e Androids recentes, mas ela SÓ funciona se você tiver senha de tela.",
        referencia: "NIST SP 800-124 — Mobile device security"
      },
      {
        cenario: "Seu celular está com Android/iOS pedindo atualização há semanas. Você adiou.",
        pergunta: "Consequência?",
        alternativas: [
          "Nenhuma, adiar não afeta.",
          "Corre risco: atualizações corrigem vulnerabilidades já conhecidas por criminosos.",
          "Só perde recursos novos.",
          "Só afeta a bateria."
        ],
        correta: 1,
        explicacao: "Toda atualização crítica corrige falhas de segurança já sendo exploradas por criminosos. Adiar 2 semanas = 2 semanas usando um dispositivo com \"porta arrombada conhecida\". Configure atualização automática à noite quando estiver no Wi-Fi. Vale para celular, computador, roteador e apps.",
        referencia: "ISO 27001 A.8.8 — Gestão de vulnerabilidades técnicas"
      },
      {
        cenario: "Seu HD/celular quebra e você perde 5 anos de fotos e documentos.",
        pergunta: "Como isso poderia ter sido evitado?",
        alternativas: [
          "Não pode ser evitado.",
          "Regra 3-2-1: 3 cópias dos dados, em 2 tipos de mídia diferentes, 1 fora da sua casa (nuvem).",
          "Só usando HD externo.",
          "Só imprimindo tudo."
        ],
        correta: 1,
        explicacao: "Regra 3-2-1: 3 cópias, 2 mídias, 1 externa (cloud). Exemplo: originais no celular, cópia em HD externo, cópia no Google Drive/OneDrive/iCloud. Backup salva de: dispositivo quebrado, roubo, ransomware, exclusão acidental. Configure sincronização automática de fotos para nuvem.",
        referencia: "ISO 27001 A.8.13 — Backup de informações"
      },
      {
        cenario: "Você vai vender seu celular ou notebook usado.",
        pergunta: "Antes de entregar:",
        alternativas: [
          "Só deletar as fotos e passar.",
          "Fazer logout do e-mail.",
          "Fazer restauração de fábrica (Factory Reset) — apaga tudo de forma segura.",
          "Passar um pano e entregar."
        ],
        correta: 2,
        explicacao: "Deletar arquivos não apaga de verdade — dados ficam recuperáveis. A restauração de fábrica limpa criptograficamente o dispositivo. Antes: (1) faça backup do que quiser guardar; (2) desvincule contas (Google, Apple ID, WhatsApp); (3) restaure de fábrica; (4) confira se as contas foram removidas. Em notebooks, considere sobrescrever o disco (\"secure erase\").",
        referencia: "NIST SP 800-88 — Media Sanitization"
      }
    ],
    badge: { icone: "💻", nome: "Guardião dos Dispositivos" }
  }
];

const CONFIG = {
  xpAcerto: 100,
  xpErro: 10,
  xpStreak: 20,
  niveis: [
    { xp: 0,    nome: "Iniciante Cauteloso", emoji: "🐣" },
    { xp: 300,  nome: "Aprendiz Digital",   emoji: "📚" },
    { xp: 700,  nome: "Vigilante",          emoji: "👀" },
    { xp: 1200, nome: "Defensor",           emoji: "🛡️" },
    { xp: 1800, nome: "Guardião Digital",   emoji: "⚔️" },
    { xp: 2500, nome: "Mestre da Segurança", emoji: "🏆" }
  ]
};

window.MISSOES = MISSOES;
window.CONFIG = CONFIG;
