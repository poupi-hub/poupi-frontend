import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F7F8FC] px-4 py-10 text-[#090A3D]">
      <article className="mx-auto max-w-3xl rounded-lg border border-[#E4E7F2] bg-white p-8 shadow-sm">
        <Link href="/dashboard" className="text-sm font-medium text-[#5B4CF0]">Voltar</Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">Termos de Uso</h1>
        <p className="mt-4 text-[#5B607C]">Estes termos explicam o uso simples e transparente do Radar do Berço.</p>
        {[
          ['Uso da plataforma', 'Você pode cadastrar produtos, acompanhar preços e configurar alertas dentro dos limites do seu plano.'],
          ['Informações de Preço', 'Os preços são coletados de lojas monitoradas e podem mudar rapidamente. Sempre confirme a oferta na loja antes de comprar.'],
          ['Planos e pagamentos', 'Planos pagos liberam limites e recursos adicionais. Cancelamentos mantêm o acesso Até o fim do período contratado quando aplicável.'],
          ['Conta do usuário', 'Você é responsável por manter seus dados atualizados e proteger sua senha.'],
          ['Disponibilidade', 'Trabalhamos para manter o serviço estável, mas coletas e notificações podem sofrer atrasos por indisponibilidade de lojas ou infraestrutura.'],
        ].map(([title, text]) => (
          <section key={title} className="mt-6">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#5B607C]">{text}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
