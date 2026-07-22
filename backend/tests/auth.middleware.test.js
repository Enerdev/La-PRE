const { permitirRoles } = require('../src/middlewares/auth.middleware');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// UT-05 del informe: "Validar el rol de un usuario antes de una acción restringida"
describe('permitirRoles (RBAC)', () => {
  test('permite el acceso si el rol del usuario está en la lista permitida', () => {
    const req = { usuario: { rol: 'direccion' } };
    const res = mockRes();
    const next = jest.fn();

    permitirRoles('direccion', 'administrador_sede')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('rechaza el acceso con 403 si el rol no corresponde', () => {
    const req = { usuario: { rol: 'estudiante' } };
    const res = mockRes();
    const next = jest.fn();

    permitirRoles('direccion')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'No tienes permiso para esta acción.' });
  });

  test('rechaza con 403 si no hay usuario autenticado en la request', () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    permitirRoles('direccion')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
