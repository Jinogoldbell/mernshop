/** Small shared UI states: loading, error and empty. */
export const Loading = ({ label = 'Loading' }) => (
  <p className="status" role="status">
    {label}…
  </p>
);

export const ErrorMessage = ({ message }) =>
  message ? (
    <p className="alert" role="alert">
      {message}
    </p>
  ) : null;

export const Empty = ({ children }) => <div className="empty">{children}</div>;
