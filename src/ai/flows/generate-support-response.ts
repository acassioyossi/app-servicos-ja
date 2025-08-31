'use server';
/**
 * @fileOverview Um fluxo de IA para responder a perguntas de suporte do usuário.
 *
 * - generateSupportResponse - Uma função que gera uma resposta para uma pergunta de suporte.
 * - GenerateSupportResponseInput - O tipo de entrada para a função.
 * - GenerateSupportResponseOutput - O tipo de retorno para a função.
 */

// Temporarily disabled for mobile build
// import { ai } from '@/ai/genkit';
// import { z } from 'genkit';
import { z } from 'zod';

// Placeholder function for mobile build
export async function generateSupportResponse(input: any) {
  return {
    response: 'Suporte temporariamente indisponível. Entre em contato conosco.',
    confidence: 0.5,
    suggestedActions: ['Contatar suporte técnico']
  };
}

/*

const GenerateSupportResponseInputSchema = z.object({
  question: z.string().describe("A pergunta do usuário."),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe("O histórico da conversa até o momento."),
});
export type GenerateSupportResponseInput = z.infer<typeof GenerateSupportResponseInputSchema>;

const GenerateSupportResponseOutputSchema = z.string().describe("A resposta gerada pela IA.");
export type GenerateSupportResponseOutput = z.infer<typeof GenerateSupportResponseOutputSchema>;


export async function generateSupportResponse(input: GenerateSupportResponseInput): Promise<GenerateSupportResponseOutput> {
  return generateSupportResponseFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateSupportResponsePrompt',
  input: { schema: GenerateSupportResponseInputSchema },
  output: { schema: GenerateSupportResponseOutputSchema },
  prompt: `Você é o "Assistente IA", um amigável e prestativo assistente de suporte para a plataforma "Serviços Já". Sua função é responder às perguntas dos usuários sobre a plataforma de forma clara, concisa e educada, sempre em português do Brasil.

Você tem conhecimento sobre as seguintes áreas da plataforma:
- **Cadastro**: Clientes e Profissionais podem se cadastrar. Profissionais precisam passar por verificação de documentos.
- **Wayne Cash**: É a moeda digital da plataforma. Clientes e profissionais ganham bônus em Wayne Cash a cada serviço. O saldo pode ser usado para obter descontos em serviços futuros.
- **Tipos de Serviço**: A plataforma oferece uma vasta gama de serviços, desde eletricistas e diaristas até aluguel de veículos e imóveis.
- **Funcionamento do App**: O cliente descreve o que precisa, um profissional aceita, o cliente acompanha a chegada por GPS em tempo real, e o pagamento é feito pelo app com segurança.
- **Segurança**: Profissionais são verificados, e há um botão de pânico no chat para emergências.
- **Suporte**: Se você não souber a resposta, oriente o usuário a procurar o "Suporte Avançado" através do e-mail suporte@servicosja.com.br.

Use o histórico da conversa para manter o contexto.

Histórico:
{{#each history}}
- {{role}}: {{content}}
{{/each}}

Pergunta do Usuário:
"{{{question}}}"

Sua Resposta:`,
});

const generateSupportResponseFlow = ai.defineFlow(
  {
    name: 'generateSupportResponseFlow',
    inputSchema: GenerateSupportResponseInputSchema,
    outputSchema: GenerateSupportResponseOutputSchema,
  },
  async ({ question, history }) => {
    const { output } = await prompt({ question, history });
    if (!output) {
      throw new Error("A IA não conseguiu gerar uma resposta.");
    }
    return output;
  }
);
*/
