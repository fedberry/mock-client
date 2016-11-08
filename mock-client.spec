Name:           mock-client
Version:        0.2.3
Release:        1%{?dist}
Summary:        Mock.fedberry.org agent to run builds.

License:        MIT
URL:            https://github.com/fedberry/mock-client
Source0:        https://github.com/fedberry/mock-client/archive/%{version}.tar.gz
BuildArch:      noarch
ExclusiveArch:  %{nodejs_arches} noarch

BuildRequires:  nodejs-packaging
BuildRequires:  systemd

Requires(post): systemd
Requires(preun): systemd
Requires(postun): systemd
Requires:       mock
Requires:       nodejs-debug

Requires(pre): /usr/sbin/useradd, /usr/bin/getent
Requires(postun): /usr/sbin/userdel

%description
Small and light nodejs based agent to run tasks from http://mock.fedberry.org


%pre
if [ "$1" = "1" ]; then
  /usr/bin/getent passwd mockclient || /usr/sbin/useradd -mNr -d /home/mockclient -s /bin/bash mockclient -g mock
fi

%post

if [ "$1" = "1" ]; then
  echo "Registering agent on http://mock.fedberry.org"
  /usr/bin/mock-client-register

  #init enviorment
  echo "Init fedberry-24-armv6l Env."
  su -l mockclient -c 'mock -r fedberry-24-armv6l --init'

  %systemd_post mock-client.service
  systemctl enable mock-client
  service mock-client start
fi

%preun
if [ "$1" = "0" ]; then
  %systemd_preun mock-client.service
fi

%postun
if [ "$1" = "0" ]; then
  %systemd_postun_with_restart mock-client.service
  /usr/sbin/userdel -fr mockclient
fi


%prep
%setup -q -n mock-client-%{version}

%build


%install
mkdir -p %{buildroot}/%{nodejs_sitelib}/mock-client
cp -pr package.json includes register.js mock-client.js %{buildroot}/%{nodejs_sitelib}/mock-client/
mkdir -p %{buildroot}/%{_bindir}
ln -s  %{nodejs_sitelib}/mock-client/mock-client.js %{buildroot}/%{_bindir}/mock-client
ln -s  %{nodejs_sitelib}/mock-client/register.js %{buildroot}/%{_bindir}/mock-client-register

chmod 755 %{buildroot}/%{nodejs_sitelib}/mock-client/mock-client.js
chmod 755 %{buildroot}/%{nodejs_sitelib}/mock-client/register.js

mkdir -p %{buildroot}/%{_sysconfdir}/mock
cp  config/fedberry-24-armv6l.cfg %{buildroot}/%{_sysconfdir}/mock/

mkdir -p %{buildroot}/%{_sysconfdir}/mock-client
cp  config/mock-client.config %{buildroot}/%{_sysconfdir}/mock-client/

mkdir -p %{buildroot}%{_unitdir}
cp mock-client.service %{buildroot}%{_unitdir}/mock-client.service

%nodejs_symlink_deps


%files
%doc LICENSE README.md
%{nodejs_sitelib}/mock-client
%{_bindir}/mock-client
%{_bindir}/mock-client-register
%{_sysconfdir}/mock/fedberry-24-armv6l.cfg
%{_sysconfdir}/mock-client
%{_sysconfdir}/mock-client/mock-client.config
%{_unitdir}/mock-client.service

%changelog
* Tue Nov 8 2016 Gor Martsen <gor@fedberry.org> - 0.2.4-1
- Do not register mock-client again when update package.
- Do not detele mockclient on upgrade phase.
- Do not init env on upgrade.

* Tue Nov 8 2016 Gor Martsen <gor@fedberry.org> - 0.2.3-1
- Use su -l in mock-client.service file. Mock require properly logged in user to work.
- sign file send request with signature.

* Mon Nov 7 2016 Gor Martsen <gor@fedberry.org> - 0.2.2-1
- Use direct pach /usr/bin/mock to avoid path conflict with /usr/sbin/mock.

* Mon Nov 7 2016 Gor Martsen <gor@fedberry.org> - 0.2.1-1
- Enable and start service.
- Fix issue with url trim.
- Add dependencies on nodejs-debug package.
- Fix mock-client.service file to log data.

* Mon Nov 7 2016 Gor Martsen <gor@fedberry.org> - 0.2.0-1
- Add service file and start service 
- Speed up mock via no cache clean via fedberry-24-armv6l.cfg.
- Mock: use DNF instead of yum.
- Register agent on start up.

* Fri Nov 4 2016 Gor Martsen <gor@fedberry.org> - 0.1.2-1
- Add mockclient user with mock group.
- Add requires on mock package.
- auto register on mock.fedberry.org.

* Thu Nov 3 2016 Gor Martsen <gor@fedberry.org> - 0.1.1-1
- Add /etc/mock-client/mock-client.config file.
- fix shabang and bin permissions

* Thu Nov 3 2016 Gor Martsen <gor@fedberry.org> - 0.1.0-1
- Initial release.
