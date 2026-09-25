import { ExternalLink } from 'lucide-react';

export default function LoginDepartmentGrid({ departments }) {
  return (
    <div className="login-dept-grid">
      {departments.map((item) => {
        const inner = (
          <>
            <div className="login-dept-front">
              <img src={item.img} alt="" loading="lazy" />
              <h3>{item.name}</h3>
            </div>
            <div className="login-dept-back">
              <p>{item.text}</p>
              {item.link ? (
                <span className="login-dept-link-hint">
                  Open application <ExternalLink size={14} />
                </span>
              ) : null}
            </div>
          </>
        );

        if (item.link) {
          return (
            <a
              key={item.name}
              className="login-dept-card"
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {inner}
            </a>
          );
        }

        return (
          <div key={item.name} className="login-dept-card login-dept-card--static">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
