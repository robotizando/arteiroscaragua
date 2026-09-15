const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// Texto livre (ex.: redes sociais do arteiro) com os endereços http(s) transformados em links.
export function TextoComLinks({ texto, className }: { texto: string; className?: string }) {
  return (
    <p className={className}>
      {texto.split(URL_REGEX).map((parte, indice) =>
        indice % 2 === 1 ? (
          <a
            key={indice}
            href={parte}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-primary underline-offset-2 hover:underline"
          >
            {parte}
          </a>
        ) : (
          parte
        ),
      )}
    </p>
  );
}
