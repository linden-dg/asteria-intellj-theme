import org.jetbrains.changelog.Changelog
import org.jetbrains.changelog.date
import org.gradle.jvm.toolchain.JavaLanguageVersion

plugins {
    id("java")
    id("org.jetbrains.intellij.platform") version "2.16.0"
    id("org.jetbrains.changelog") version "2.5.0"
}

group = providers.gradleProperty("pluginGroup").get()
version = providers.gradleProperty("pluginVersion").get()

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    intellijPlatform {
        intellijIdea(providers.gradleProperty("platformVersion").get())
    }
}

java {
    toolchain {
        languageVersion.set(
            providers.gradleProperty("javaToolchainVersion").map(String::toInt).map(JavaLanguageVersion::of),
        )
    }
}

intellijPlatform {
    buildSearchableOptions = false

    pluginConfiguration {
        id.set(providers.gradleProperty("pluginGroup"))
        name.set(providers.gradleProperty("pluginName"))
        version.set(providers.gradleProperty("pluginVersion"))

        changelog {
            version.set(providers.gradleProperty("pluginVersion"))
            path.set(file("CHANGELOG.md").canonicalPath)
            header.set(provider { "${version.get()} - ${date()}" })
            headerParserRegex.set("""(\d+\.\d+\.\d+)""".toRegex())
            itemPrefix.set("-")
            keepUnreleasedSection.set(true)
            unreleasedTerm.set("[Unreleased]")
            groups.set(listOf("Added", "Changed", "Deprecated", "Removed", "Fixed", "Security"))
        }

        ideaVersion {
            sinceBuild.set(providers.gradleProperty("pluginSinceBuild"))
        }
    }

    signing {
        certificateChain = providers.environmentVariable("CERTIFICATE_CHAIN")
        privateKey = providers.environmentVariable("PRIVATE_KEY")
        password = providers.environmentVariable("PRIVATE_KEY_PASSWORD")
    }

    publishing {
        token.set(providers.environmentVariable("PUBLISH_TOKEN"))
    }
}

tasks {
    providers.gradleProperty("javaVersion").get().let {
        withType<JavaCompile> {
            sourceCompatibility = it
            targetCompatibility = it
            options.release.set(it.toInt())
        }
    }

    wrapper {
        gradleVersion = providers.gradleProperty("gradleVersion").get()
    }

    patchPluginXml {
        pluginVersion.set(providers.gradleProperty("pluginVersion"))
        sinceBuild.set(providers.gradleProperty("pluginSinceBuild"))
        changeNotes.set(
            provider { changelog.renderItem(changelog.getLatest(), Changelog.OutputType.HTML) },
        )
    }

    publishPlugin {
        dependsOn("patchChangelog")
    }
}
