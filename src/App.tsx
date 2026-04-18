import { Button, Icon, Layout } from "@stellar/design-system"
import { Routes, Route, Outlet, NavLink } from "react-router-dom"
import styles from "./App.module.css"
import { labPrefix } from "./contracts/util"
import Debug from "./pages/Debug"
import Home from "./pages/Home"

function App() {
	return (
		<Routes>
			<Route element={<AppLayout />}>
				<Route path="/" element={<Home />} />
				<Route path="/debug" element={<Debug />} />
				<Route path="/debug/:contractName" element={<Debug />} />
			</Route>
		</Routes>
	)
}

const AppLayout: React.FC = () => (
	<div className={styles.AppLayout}>
		<Layout.Header
			projectId="LootBox"
			projectTitle="⚡ LootBox"
			hasThemeSwitch={false}
			contentCenter={
				<>
					<NavLink to="/debug">
						{({ isActive }) => (
							<Button variant="tertiary" size="md" disabled={isActive}>
								<Icon.Code02 size="md" />
								Contract Explorer
							</Button>
						)}
					</NavLink>
					<NavLink to={labPrefix()}>
						<Button variant="tertiary" size="md">
							<Icon.SearchMd size="md" />
							Tx Explorer
						</Button>
					</NavLink>
				</>
			}
		/>

		<main>
			<Layout.Content>
				<Layout.Inset>
					<Outlet />
				</Layout.Inset>
			</Layout.Content>
		</main>

		<Layout.Footer>
			<nav>
				<a
					href="https://developers.stellar.org/docs/smart-contracts"
					className="Link Link--secondary"
					target="_blank"
				>
					<Icon.BookOpen01 size="sm" /> Soroban Docs
				</a>
				<a
					href="https://github.com/theahaco/scaffold-stellar"
					className="Link Link--secondary"
					target="_blank"
				>
					<Icon.GitPullRequest size="sm" /> GitHub
				</a>
			</nav>
		</Layout.Footer>
	</div>
)

export default App
