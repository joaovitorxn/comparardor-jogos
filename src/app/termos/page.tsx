import type { Metadata } from "next";
import Link from "next/link";
import { Callout, LegalPage, P, Ul, type LegalSection } from "@/components/legal-page";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "As regras de uso do Dropou: o que o site faz, a precisão dos preços, os links de afiliados e as responsabilidades de cada lado.",
  alternates: { canonical: "/termos" },
};

const sections: LegalSection[] = [
  {
    id: "o-servico",
    title: "O que é o Dropou",
    body: (
      <>
        <P>
          O {BRAND.name} é um comparador de preços de jogos: reúne ofertas de várias lojas (de PC e de console) para você ver onde está mais barato, acompanhar o histórico de
          preço e receber alertas.
        </P>
        <Callout title="Importante">
          <p>
            <strong className="font-semibold text-text">O Dropou não vende jogos.</strong> A compra acontece sempre na loja, que é a responsável pelo pagamento, pela entrega da chave
            ou do jogo, pelo suporte e por reembolsos.
          </p>
        </Callout>
        <P>Usar o site é gratuito, e ao usar você concorda com estes termos.</P>
      </>
    ),
  },
  {
    id: "beta",
    title: "Fase beta",
    body: (
      <P>
        O {BRAND.name} ainda está em desenvolvimento. Funções podem mudar, sumir ou ficar fora do ar por um tempo, e podem aparecer erros. Se você achar algum, o botão de
        feedback é a melhor forma de nos avisar, e a gente agradece.
      </P>
    ),
  },
  {
    id: "precos",
    title: "Preços e informações",
    body: (
      <>
        <P>
          Coletamos os preços diretamente das lojas e de serviços parceiros, em reais, e fazemos o possível para mantê-los atualizados. Mas eles podem mudar a qualquer momento,
          e pode haver atraso, diferença de região ou erro.
        </P>
        <Ul>
          <li>
            <strong className="font-semibold text-text">O preço válido é sempre o da loja</strong> na hora da compra. Confira antes de pagar.
          </li>
          <li>
            O histórico de preço mostra o que registramos ou recebemos de parceiros; em lojas de console, ele começa quando passamos a acompanhá-las.
          </li>
          <li>Dados como notas, tempo para zerar, requisitos e descrições vêm de fontes de terceiros e podem estar incompletos ou desatualizados.</li>
        </Ul>
      </>
    ),
  },
  {
    id: "afiliados",
    title: "Links de afiliados e independência",
    body: (
      <>
        <P>
          Alguns links para lojas podem ser <strong className="font-semibold text-text">links de afiliado</strong>: se você comprar depois de clicar neles, o {BRAND.name} pode
          receber uma comissão da loja. <strong className="font-semibold text-text">Isso não aumenta o preço que você paga.</strong>
        </P>
        <Callout title="Como isso afeta a ordem das ofertas">
          <p>
            Ordenamos as ofertas pelo menor preço, sempre. A única preferência que existe é de desempate: se duas lojas estiverem com exatamente o mesmo preço, mostramos
            primeiro a de uma loja parceira. Priorizamos as lojas parceiras só nesse empate: uma loja parceira nunca aparece na frente de uma mais barata.
          </p>
        </Callout>
        <P>As comissões ajudam a manter o site no ar e gratuito.</P>
      </>
    ),
  },
  {
    id: "alertas",
    title: "Alertas de preço",
    body: (
      <P>
        Os alertas são um recurso de melhor esforço: enviamos a notificação quando nossas coletas detectam o preço combinado, mas não garantimos que ela chegue, nem que
        chegue na hora, nem que o preço ainda esteja disponível quando você abrir a loja. Notificações dependem do navegador, do aparelho e das suas permissões.
      </P>
    ),
  },
  {
    id: "uso-adequado",
    title: "Como usar o site",
    body: (
      <>
        <P>Use o site de forma normal e respeitosa. Não é permitido:</P>
        <Ul>
          <li>sobrecarregar o site com acessos automáticos em volume, nem tentar burlar limites de uso;</li>
          <li>copiar o conteúdo do {BRAND.name} em massa ou revender os dados de preço como se fossem seus;</li>
          <li>tentar invadir, atrapalhar ou explorar falhas do site ou dos serviços que ele usa;</li>
          <li>enviar, pelo formulário de feedback, conteúdo ofensivo, ilegal ou que não seja seu.</li>
        </Ul>
        <P>Se você achar uma falha de segurança, por favor nos avise pelo feedback em vez de divulgá-la.</P>
      </>
    ),
  },
  {
    id: "propriedade",
    title: "Marcas, imagens e propriedade intelectual",
    body: (
      <>
        <P>
          Nomes de jogos, capas, imagens, logotipos e marcas das lojas e dos desenvolvedores pertencem aos seus respectivos donos, e aparecem no site só para identificar
          cada jogo e cada loja. O {BRAND.name} é um projeto independente: não pertence às lojas e empresas citadas e nenhuma delas patrocina ou endossa o site. Algumas
          podem ser parceiras do programa de afiliados, como explicado acima.
        </P>
        <P>
          O nome e a marca {BRAND.name}, o visual do site e o seu código são do projeto e não podem ser copiados ou usados como se fossem de outra pessoa sem autorização. Se
          você é dono de algum conteúdo exibido e quiser que seja ajustado ou removido, fale com a gente.
        </P>
      </>
    ),
  },
  {
    id: "responsabilidade",
    title: "Limite de responsabilidade",
    body: (
      <>
        <P>
          Oferecemos o site &ldquo;como está&rdquo;, sem garantia de que ficará sempre disponível ou sem erros. O {BRAND.name} não se responsabiliza por compras feitas nas lojas, por
          diferenças entre o preço exibido e o preço cobrado, por problemas com chaves, contas ou entrega, nem por decisões de compra tomadas com base apenas nas informações do
          site.
        </P>
        <P>Isso não afasta direitos que a lei garante a você como consumidor.</P>
      </>
    ),
  },
  {
    id: "privacidade",
    title: "Privacidade",
    body: (
      <P>
        O tratamento de dados está descrito na{" "}
        <Link href="/privacidade" className="font-medium text-accent underline-offset-2 hover:underline">
          Política de Privacidade
        </Link>
        , que faz parte destes termos.
      </P>
    ),
  },
  {
    id: "mudancas-lei",
    title: "Mudanças, lei aplicável e contato",
    body: (
      <>
        <P>
          Podemos atualizar estes termos quando o site mudar, e a data no topo da página mostra a última atualização. Continuar usando o site depois de uma mudança significa
          que você concorda com a nova versão.
        </P>
        <P>
          Estes termos seguem as leis do Brasil. Para dúvidas, sugestões ou pedidos, use o botão de feedback do site
          {BRAND.contactEmail ? (
            <>
              {" "}
              ou escreva para <a href={`mailto:${BRAND.contactEmail}`} className="font-medium text-accent underline-offset-2 hover:underline">{BRAND.contactEmail}</a>
            </>
          ) : null}
          .
        </P>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      icon="doc"
      updated="6 de outubro de 2026"
      intro="As regras do jogo, sem juridiquês: o que o Dropou faz, o que ele não faz e o que esperar dos preços e dos links."
      summaryTitle="Resumo em 30 segundos"
      summary={[
        "O Dropou compara preços; a compra acontece na loja, que é a responsável por ela.",
        "Os preços são coletados com cuidado, mas podem mudar: o que vale é o preço da loja na hora de comprar.",
        "Alguns links podem ser de afiliado (sem custo extra para você), e isso nunca muda a ordem pelo menor preço.",
        "O site está em beta: pode ter erros, e seu feedback é muito bem-vindo.",
        "Marcas e imagens são dos seus donos, e o Dropou é um projeto independente: nenhuma loja o patrocina.",
      ]}
      sections={sections}
      other={{ href: "/privacidade", label: "Ler a Política de Privacidade" }}
    />
  );
}
