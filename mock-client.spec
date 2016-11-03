Name:           mock-client
Version:        0.1.0
Release:        1%{?dist}
Summary:        Mock.fedberry.org agent to run builds.

License:        MIT
URL:            https://github.com/fedberry/mock-client
Source0:        https://github.com/fedberry/mock-client/archive/%{version}.tar.gz
BuildArch:      noarch
ExclusiveArch:  %{nodejs_arches} noarch

BuildRequires:  nodejs-packaging

%description
Small and light nodejs based agent to run tasks from http://mock.fedberry.org


%prep
%setup -q -n mock-client-%{version}

%build


%install
mkdir -p %{buildroot}/%{nodejs_sitelib}/mock-client
cp -pr package.json includes register.js mock-client.js %{buildroot}/%{nodejs_sitelib}/mock-client/
mkdir -p %{buildroot}/%{_bindir}
ln -s  %{nodejs_sitelib}/mock-client/mock-client.js %{buildroot}/%{_bindir}/mock-client
ln -s  %{nodejs_sitelib}/mock-client/register.js %{buildroot}/%{_bindir}/mock-client-register

mkdir -p %{buildroot}/%{_sysconfdir}/mock
cp  config/fedberry-24-armv6l.cfg %{buildroot}/%{_sysconfdir}/mock/

%nodejs_symlink_deps


%files
%doc LICENSE README.md
%{nodejs_sitelib}/mock-client
%{_bindir}/mock-client
%{_bindir}/mock-client-register
%{_sysconfdir}/mock/fedberry-24-armv6l.cfg


%changelog
* Thu Nov 3 2016 Gor Martsen <gor@fedberry.org> - 0.1.0-1
- Initial release.
