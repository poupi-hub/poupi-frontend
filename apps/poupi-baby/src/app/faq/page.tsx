import Link from 'next/link';

const items = [
  ['Como funcionam os alertas?', 'Você adiciona um produto e define uma meta. O Radar do Berço acompanha as ofertas e avisa quando o Preço chega ao valor desejado.'],
  ['O que muda no Premium?', 'O Premium aumenta limites, libera mais histórico e melhora a prioridade de acompanhamento, conforme o plano escolhido.'],
  ['Como recebo notificações?', 'As notificações dependem do e-mail confirmado. Por isso recomendamos confirmar seu e-mail na página Minha conta.'],
  ['Quais pagamentos são aceitos?', 'Os pagamentos dependem do gateway configurado na plataforma. Em desenvolvimento, o sistema pode usar um gateway de teste.'],
  ['Posso cancelar?', 'Sim. O cancelamento pode ser feito na página de planos. O acesso permanece Até o fim do período já pago quando houver assinatura ativa.'],
  ['Quais lojas são monitoradas?', 'A quantidade real de lojas aparece na home com base nas ofertas cadastradas. A plataforma Não exibe lojas fictícias.'],
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-[#F7F8FC] px-4 py-10 text-[#090A3D]">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-sm font-medium text-[#5B4CF0]">Voltar</Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">Perguntas frequentes</h1>
        <p className="mt-2 text-sm text-[#5B607C]">Respostas diretas sobre alertas, planos, notificações e lojas monitoradas.</p>
        <div className="mt-6 divide-y divide-[#EDF0FB] rounded-lg border border-[#E4E7F2] bg-white shadow-sm">
          {items.map(([question, answer]) => (
            <section key={question} className="p-5">
              <h2 className="font-semibold">{question}</h2>
              <p className="mt-2 text-sm leading-6 text-[#5B607C]">{answer}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
