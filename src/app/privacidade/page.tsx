import type { Metadata } from "next";
import { Callout, LegalPage, P, Table, Ul, type LegalSection } from "@/components/legal-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Quais dados o Dropou guarda, para quê, por quanto tempo e como você pode apagá-los. Sem conta, sem cadastro.",
  alternates: { canonical: "/privacidade" },
};

const contact = BRAND.contactEmail ? (
  <>
    pelo e-mail <a href={`mailto:${BRAND.contactEmail}`} className="font-medium text-accent underline-offset-2 hover:underline">{BRAND.contactEmail}</a> ou
  </>
) : null;

const sections: LegalSection[] = [
  {
    id: "quem-somos",
    title: "Quem é o responsável",
    body: (
      <>
        <P>
          O {BRAND.name} ({BRAND.domain}) é um site que compara preços de jogos em várias lojas. O {BRAND.name} é mantido por uma única pessoa, e o responsável pelo tratamento dos dados descritos aqui é a pessoa que o mantém.
        </P>
        <P>Você não precisa criar conta, informar nome, CPF ou e-mail para usar o site. Só trato o mínimo para ele funcionar.</P>
      </>
    ),
  },
  {
    id: "o-que-guardamos",
    title: "O que guardo e para quê",
    body: (
      <>
        <Table
          head={["O quê", "Para quê", "Onde fica"]}
          rows={[
            ["Plataformas e forma de ver as listas", "Mostrar só o que vale para o que você joga e lembrar se prefere cards, lista ou tabela", "Cookies do navegador, por até 1 ano"],
            ["Sua wishlist (jogos salvos)", "Montar a página Wishlist", "Só no seu navegador. Não vai para o meu servidor"],
            ["Identificador aleatório de visita", "Contar quantas pessoas estão no site agora. Não identifica você", "Navegador e meu banco de dados; registros com mais de 24 horas são apagados"],
            ["Alertas de preço", "Avisar por notificação quando o jogo baixar. Guardo o endereço da sua inscrição de notificações, o jogo, a plataforma e o preço-alvo", "Meu banco de dados, até você remover o alerta ou a inscrição expirar"],
            ["Feedback", "Ler e responder o que você mandou: mensagem, tipo, página em que estava, navegador e o contato, se você escreveu", "Meu banco de dados e um canal privado meu no Discord"],
            ["Estatísticas de acesso", "Saber quais páginas são mais vistas e de onde vêm os acessos, sem identificar pessoas", "Vercel Web Analytics, sem cookies"],
            ["Dados técnicos da hospedagem (como o endereço IP)", "Segurança, desempenho e correção de erros", "Registros da Vercel, por tempo limitado"],
          ]}
        />
        <Callout title="O que eu não faço">
          <p>Não vendo seus dados, não crio perfil de você, não uso anúncios de terceiros e não coloco rastreadores de publicidade no site.</p>
        </Callout>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies e armazenamento no navegador",
    body: (
      <>
        <P>Uso apenas o que o site precisa para lembrar suas escolhas. Nenhum cookie é de publicidade.</P>
        <Ul>
          <li>
            <strong className="font-semibold text-text">dropou_plataformas</strong>: as plataformas que você marcou no cabeçalho.
          </li>
          <li>
            <strong className="font-semibold text-text">dropou_vista</strong>: a forma de ver as listas (cards, compacto, lista ou tabela).
          </li>
          <li>
            <strong className="font-semibold text-text">Armazenamento local do navegador</strong>: sua wishlist, o identificador aleatório da contagem de pessoas online e a
            marcação de que você já viu o aviso de beta.
          </li>
        </Ul>
        <P>
          Você pode apagar tudo isso a qualquer momento nas configurações do navegador (limpar dados do site). O site continua funcionando, só volta ao padrão.
        </P>
      </>
    ),
  },
  {
    id: "alertas",
    title: "Alertas por notificação",
    body: (
      <>
        <P>
          Os alertas usam as notificações do seu navegador, e você só os recebe se permitir. Ao criar um alerta, seu navegador gera um endereço de entrega que
          guardo para poder avisar você. Esse endereço <strong className="font-semibold text-text">não contém seu nome, e-mail ou telefone</strong>.
        </P>
        <P>
          Para entregar a notificação, o endereço pertence ao serviço do seu navegador (Google, Mozilla, Microsoft ou Apple), que recebe o aviso e o repassa ao seu
          aparelho. Para parar de receber, remova o alerta na página do jogo ou na Wishlist, ou bloqueie as notificações do site no navegador.
        </P>
      </>
    ),
  },
  {
    id: "compartilhamento",
    title: "Com quem os dados passam",
    body: (
      <>
        <P>Uso serviços de terceiros para o site existir. Eles tratam os dados só para prestar esse serviço:</P>
        <Ul>
          <li>
            <strong className="font-semibold text-text">Vercel</strong>: hospedagem do site e estatísticas de acesso.
          </li>
          <li>
            <strong className="font-semibold text-text">Turso</strong>: banco de dados (servidor em São Paulo).
          </li>
          <li>
            <strong className="font-semibold text-text">Discord</strong>: recebe os feedbacks em um canal privado meu.
          </li>
          <li>
            <strong className="font-semibold text-text">Serviços de notificação</strong> do seu navegador, descritos acima.
          </li>
        </Ul>
        <P>
          Os links de compra levam a lojas de terceiros (Steam, Nuuvem, PlayStation Store e outras). Ao entrar nelas, valem a política e os cookies de cada loja,
          que não controlo. Alguns desses links podem ser de afiliados (veja os Termos de Uso).
        </P>
        <P>Alguns desses serviços ficam em outros países, então seus dados podem ser processados fora do Brasil, com as garantias previstas na LGPD.</P>
      </>
    ),
  },
  {
    id: "base-legal",
    title: "Por que posso tratar esses dados",
    body: (
      <Ul>
        <li>
          <strong className="font-semibold text-text">Prestar o serviço que você pediu</strong>, como os alertas e a wishlist.
        </li>
        <li>
          <strong className="font-semibold text-text">Seu consentimento</strong>, quando você permite as notificações ou escreve um feedback com contato.
        </li>
        <li>
          <strong className="font-semibold text-text">Meu interesse legítimo</strong> em manter o site seguro, evitar abusos e entender, de forma anônima, o que
          funciona e o que não funciona.
        </li>
      </Ul>
    ),
  },
  {
    id: "seus-direitos",
    title: "Seus direitos",
    body: (
      <>
        <P>Pela Lei Geral de Proteção de Dados (LGPD), você pode pedir, a qualquer momento:</P>
        <Ul>
          <li>confirmar se trato algum dado seu e ter acesso a ele;</li>
          <li>corrigir dados incorretos;</li>
          <li>apagar dados ou anonimizá-los;</li>
          <li>retirar um consentimento (por exemplo, remover os alertas);</li>
          <li>saber com quem os dados foram compartilhados.</li>
        </Ul>
        <Callout title="Como pedir">
          <p>
            Fale comigo {contact} pelo botão de feedback do site (o ícone de inseto no canto da tela). Como não há conta, se o pedido for sobre um alerta ou um
            feedback específico, diga qual para eu localizar. Respondo em prazo razoável.
          </p>
        </Callout>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "Segurança e guarda dos dados",
    body: (
      <>
        <P>
          Uso conexão segura (HTTPS), guardo o mínimo possível e só eu tenho acesso ao banco de dados. Nenhum sistema é totalmente imune, mas trabalho para reduzir riscos e, se houver um incidente que afete seus dados, aviso como a lei exige.
        </P>
        <P>
          Mantenho cada dado só pelo tempo necessário: os registros da contagem de pessoas online somem em 24 horas, os alertas ficam até você removê-los e os feedbacks
          ficam até serem tratados ou até você pedir a exclusão.
        </P>
      </>
    ),
  },
  {
    id: "criancas",
    title: "Crianças e adolescentes",
    body: (
      <P>
        O {BRAND.name} é um site de consulta de preços e não pede dados pessoais, mas não é voltado a crianças. Se você é responsável por um menor e acha que ele nos enviou
        algum dado, fale comigo para eu apagar.
      </P>
    ),
  },
  {
    id: "mudancas",
    title: "Mudanças nesta política",
    body: (
      <P>
        O site está em beta e muda com frequência. Quando algo importante mudar no tratamento de dados, atualizo esta página e a data no topo. Recomendo voltar
        aqui de vez em quando.
      </P>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      icon="shield"
      updated="6 de outubro de 2026"
      intro="Sem conta, sem cadastro e sem anúncios. Aqui está, em linguagem simples, tudo o que o Dropou guarda sobre você e como apagar."
      summaryTitle="Resumo em 30 segundos"
      summary={[
        "Você usa o site sem criar conta, sem informar nome nem e-mail.",
        "Guardo suas escolhas (plataformas e forma de ver as listas) e sua wishlist no seu próprio navegador.",
        "Os alertas de preço usam as notificações do navegador e não guardam nenhum dado que identifique você.",
        "Não vendo dados, não faço perfil e não tenho anúncios de terceiros.",
        "Você pode pedir para apagar o que for seu a qualquer momento.",
      ]}
      sections={sections}
      other={{ href: "/termos", label: "Ler os Termos de Uso" }}
    />
  );
}
